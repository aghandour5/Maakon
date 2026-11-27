import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { usersTable, postsTable, ngosTable, sessionsTable, type User } from "@workspace/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  SupabaseLoginBody,
  CompleteProfileBody,
  CompleteNgoProfileBody,
  CreateDraftPostBody,
  validPublicContact,
} from "@workspace/api-zod";

import { durationDays } from "../lib/post-review";
import { verifySupabaseToken } from "../lib/supabase-admin";

import {
  createSession,
  destroySession,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionClearCookieOptions,
} from "../lib/session";
import {
  CSRF_COOKIE_NAME,
  createCsrfToken,
  getCsrfClearCookieOptions,
  getCsrfCookieOptions,
} from "../lib/csrf";
import { requireAuth } from "../middlewares/auth";
import { rateLimit as customRateLimit } from "../middlewares/rateLimit";
import { rateLimit as expressRateLimit } from "express-rate-limit";
import { logger } from "../lib/logger";
import { getPublicCoordinates } from "../lib/post-location";
import { canPublishOffer, OFFER_REFERRAL_REQUIRED } from "../lib/offer-policy";
import { isVulnerableNeedPost } from "../lib/post-serializers";
import { isValidLocation } from "@workspace/locations";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import qrcode from "qrcode";

const router = Router();
const usersTableWithSupabase = usersTable as typeof usersTable & {
  supabaseUid: unknown;
};
const loginLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, please try again later." },
});

const mfaLimiter = customRateLimit(
  15 * 60 * 1000,
  10,
  "Too many MFA attempts, please try again later.",
);
const draftPostLimiter = customRateLimit(
  10 * 60 * 1000,
  20,
  "Too many draft post submissions, please try again later.",
);

// ── Supabase Email-Link Login ─────────────────────────────────────────────────

function sessionUser(user: User, mfaVerified: boolean) {
  // Older individual accounts could finish onboarding with a display name alone.
  const onboardingComplete = user.onboardingComplete && (user.accountType === "ngo" ||
    Boolean(user.displayName?.trim() && user.emailVerified && user.email && user.phone &&
      isValidLocation(user.governorate, user.district)));
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    governorate: user.governorate,
    district: user.district,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    accountType: user.accountType,
    role: user.role,
    onboardingComplete,
    emailVerified: user.emailVerified,
    ngoVerificationStatus: user.ngoVerificationStatus,
    mfaEnabled: user.mfaEnabled,
    mfaVerified,
  };
}

router.post("/auth/supabase-login", loginLimiter, async (req: Request, res: Response) => {
  const parsed = SupabaseLoginBody.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ err: parsed.error, path: req.originalUrl }, "Supabase login validation failed");
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const { idToken, accountType, draftToken } = parsed.data;

  let tokenPayload;
  try {
    tokenPayload = await verifySupabaseToken(idToken);
  } catch (err) {
    logger.error({ err }, "Supabase token verification failed");
    res.status(401).json({ error: "Invalid or expired Supabase token" });
    return;
  }

  const { uid, email, email_verified } = tokenPayload;

  if (!email) {
    res.status(400).json({ error: "Supabase token does not contain an email" });
    return;
  }

  if (email_verified !== true) {
    logger.warn({ supabaseUid: uid }, "Rejected Supabase login with unverified email");
    res.status(403).json({ error: "Email must be verified before login" });
    return;
  }

  // 1. Find or create user by supabaseUid
  let userRows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTableWithSupabase.supabaseUid as never, uid))
    .limit(1);
  let user = userRows[0];
  let isNew = false;

  if (!user) {
    // Check if a user with this email already exists (e.g. previously created)
    const byEmail = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (byEmail[0]) {
      // Link existing user to Supabase UID
      const [updated] = await db
        .update(usersTable)
        .set({
          supabaseUid: uid,
          emailVerified: email_verified ?? false,
          updatedAt: new Date(),
        } as any)
        .where(eq(usersTable.id, byEmail[0].id))
        .returning();
      user = updated;
    } else {
      // New registration
      isNew = true;
      const [inserted] = await db
        .insert(usersTable)
        .values({
          supabaseUid: uid,
          email,
          emailVerified: email_verified ?? false,
          accountType: accountType || "individual",
          onboardingComplete: false,
        } as any)
        .returning();
      user = inserted;
    }
  } else {
    // Existing user — update email verification status
    if (!user.email || !user.emailVerified) {
      await db.update(usersTable).set({
        email: user.email ?? email,
        emailVerified: true,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, user.id));
      user = { ...user, email: user.email ?? email, emailVerified: true };
    }
  }

  // 2. Claim draft post if draftToken was provided
  let referral: { governorate: string; district: string | null } | undefined;
  let claimedPost: { id: number; postType: string; status: string } | undefined;
  if (draftToken) {
    const claimable = and(
      eq(postsTable.draftToken, draftToken),
      eq(postsTable.status, "draft"),
      isNull(postsTable.userId),
      canPublishOffer(user) ? undefined : eq(postsTable.postType, "need"),
    );
    const claimed = await db.transaction(async tx => {
      const [draft] = await tx.select().from(postsTable).where(claimable).limit(1).for("update");
      if (!draft) return undefined;
      const now = new Date();
      const [post] = await tx.update(postsTable).set({
        userId: user.id, draftToken: null, status: draft.postType === "need" ? "pending" : "active",
        lastConfirmedAt: now, updatedAt: now,
        expiresAt: new Date(now.getTime() + durationDays(draft) * 86400000),
      }).where(and(eq(postsTable.id, draft.id), claimable))
        .returning({ id: postsTable.id, postType: postsTable.postType, status: postsTable.status });
      return post;
    });
    if (claimed) {
      claimedPost = claimed;
      logger.info({ userId: user.id }, "Draft post claimed after email-link sign-in");
    } else {
      [referral] = await db.select({
        governorate: postsTable.governorate,
        district: postsTable.district,
      }).from(postsTable)
        .where(and(eq(postsTable.draftToken, draftToken), eq(postsTable.postType, "offer")))
        .limit(1);
    }
  }

  // 3. Create session (Always, even for admins)
  const token = await createSession(user.id, req.ip, req.headers["user-agent"]);
  const csrfToken = createCsrfToken();

  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

  const mfaStatus =
    user.role === "admin"
      ? user.mfaEnabled
        ? "mfa_challenge"
        : "mfa_setup_required"
      : "success";

  res.json({
    status: mfaStatus,
    user: sessionUser(user, false),
    isNew,
    ...(claimedPost ? { claimedPost } : {}),
    ...(referral ? { referral } : {}),
  });
});

// ── Admin MFA Flow ────────────────────────────────────────────────────────────

router.post("/auth/mfa-setup", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.role !== "admin") {
    res.status(403).json({ error: "Reserved for admins" });
    return;
  }

  if (user.mfaEnabled) {
    res.status(400).json({ error: "MFA is already set up" });
    return;
  }

  try {
    const secret = generateSecret();
    const otpauth = generateURI({ issuer: "Maakon Admin", label: user.email || "admin", secret });

    // Save secret
    await db.update(usersTable).set({ mfaSecret: secret }).where(eq(usersTable.id, user.id));

    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
    res.json({ qrCodeDataUrl });
  } catch (err) {
    logger.error({ err }, "MFA setup failed");
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

router.post("/auth/mfa-verify", requireAuth, mfaLimiter, async (req: Request, res: Response) => {
  const user = req.user!;
  const sessionId = req.sessionId;

  const { code } = req.body;
  if (!code || typeof code !== "string" || code.length !== 6) {
    res.status(400).json({ error: "Invalid code format" });
    return;
  }

  if (!user.mfaSecret) {
    res.status(400).json({ error: "Setup not initiated" });
    return;
  }

  try {
    const verifyResult = await verifyTotp({ secret: user.mfaSecret, token: code });
    if (!verifyResult.valid) {
      res.status(400).json({ error: "Incorrect or expired code" });
      return;
    }

    // Enable MFA for user
    await db.update(usersTable).set({ mfaEnabled: true }).where(eq(usersTable.id, user.id));

    // Mark current session as verified
    await db.update(sessionsTable)
      .set({ mfaVerified: true })
      .where(eq(sessionsTable.token, sessionId!));

    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: "Verification error" });
  }
});

router.post("/auth/mfa-challenge", requireAuth, mfaLimiter, async (req: Request, res: Response) => {
  const user = req.user!;
  const sessionId = req.sessionId;

  const { code } = req.body;
  if (!code || typeof code !== "string" || code.length !== 6) {
    res.status(400).json({ error: "Invalid code format" });
    return;
  }

  if (!user.mfaSecret || !user.mfaEnabled) {
    res.status(400).json({ error: "MFA not established" });
    return;
  }

  try {
    const verifyResult = await verifyTotp({ secret: user.mfaSecret, token: code });
    if (!verifyResult.valid) {
      res.status(400).json({ error: "Incorrect or expired code" });
      return;
    }

    // Mark current session as verified
    await db.update(sessionsTable)
      .set({ mfaVerified: true })
      .where(eq(sessionsTable.token, sessionId!));

    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: "Verification error" });
  }
});

// ── Draft Post Creation (unauthenticated) ─────────────────────────────────────

router.post("/posts/draft", draftPostLimiter, async (req: Request, res: Response) => {
  const parsed = CreateDraftPostBody.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ err: parsed.error, path: req.originalUrl }, "Draft post validation failed");
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  if (parsed.data.postType === "offer") {
    return void res.status(403).json(OFFER_REFERRAL_REQUIRED);
  }

  const draftToken = crypto.randomBytes(32).toString("hex");
  const draftData = parsed.data as typeof parsed.data & {
    providedLat?: number;
    providedLng?: number;
  };

  if (!isValidLocation(draftData.governorate, draftData.district)) {
    res.status(400).json({ error: "Invalid governorate or district" });
    return;
  }

  const { publicLat, publicLng } = getPublicCoordinates(
    draftData.postType,
    draftData.governorate,
    draftData.district ?? null,
    draftData.providedLat ?? null,
    draftData.providedLng ?? null,
    draftData.providerType ?? null,
  );
  const storePrivateLocation = !isVulnerableNeedPost(
    draftData.postType,
    draftData.providerType ?? null,
  );
  const storedPrivateLat = storePrivateLocation ? draftData.providedLat ?? null : null;
  const storedPrivateLng = storePrivateLocation ? draftData.providedLng ?? null : null;

  const isNgoNeed = draftData.providerType === "ngo";
  if (isNgoNeed && !validPublicContact(draftData.publicContactMethod, draftData.publicContactInfo)) {
    return void res.status(400).json({ error: "Invalid public contact" });
  }

  // Compute expiry
  const expiresInDays = parsed.data.expiresInDays && parsed.data.expiresInDays > 0
    ? Math.min(parsed.data.expiresInDays, 90)
    : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const [post] = await db.insert(postsTable).values({
    postType: parsed.data.postType,
    title: parsed.data.title,
    category: parsed.data.category,
    description: parsed.data.description,
    urgency: parsed.data.urgency ?? null,
    governorate: parsed.data.governorate,
    district: parsed.data.district ?? null,
    publicLat,
    publicLng,
    privateLat: storedPrivateLat,
    privateLng: storedPrivateLng,
    exactAddressPrivate: parsed.data.exactAddressPrivate ?? null,
    providerType: parsed.data.providerType ?? null,
    contactMethod: parsed.data.contactMethod ?? null,
    contactInfo: parsed.data.contactInfo ?? null,
    publicContactMethod: isNgoNeed ? draftData.publicContactMethod : null,
    publicContactInfo: isNgoNeed ? draftData.publicContactInfo?.trim() : null,
    lastConfirmedAt: new Date(),
    status: "draft",
    draftToken,
    userId: null,
    expiresAt,
  }).returning();

  res.status(201).json({ draftToken, postId: post.id });
});

// ── Profile Completion ────────────────────────────────────────────────────────

router.post("/auth/complete-profile", requireAuth, async (req: Request, res: Response) => {
  const parsed = CompleteProfileBody.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ err: parsed.error, path: req.originalUrl }, "Complete profile validation failed");
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const user = req.user!;
  if (user.accountType !== "individual" || !user.email || !user.emailVerified) {
    res.status(400).json({ error: "A verified individual account is required" });
    return;
  }
  const { displayName, phone, governorate, district } = parsed.data;
  if (!isValidLocation(governorate, district)) {
    res.status(400).json({ error: "Invalid governorate or district" });
    return;
  }
  const updated = await db.update(usersTable).set({
    displayName,
    phone,
    governorate,
    district: district || null,
    onboardingComplete: true,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, user.id)).returning();

  res.json({ success: true, user: sessionUser(updated[0], req.mfaVerified ?? false) });
});

router.post("/auth/complete-ngo-profile", requireAuth, async (req: Request, res: Response) => {
  const parsed = CompleteNgoProfileBody.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ err: parsed.error, path: req.originalUrl }, "Complete NGO profile validation failed");
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const user = req.user!;

  if (user.accountType !== "ngo") {
    res.status(400).json({ error: "User is not registered as an NGO account type" });
    return;
  }

  // Ensure the user hasn't already created an NGO profile
  const existing = await db.select().from(ngosTable).where(
    eq(ngosTable.userId, user.id)
  ).limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "An NGO profile already exists for this user." });
    return;
  }

  const { orgName, description, governorate, district, phone, website } = parsed.data;

  if (!isValidLocation(governorate, district)) {
    res.status(400).json({ error: "Invalid governorate or district" });
    return;
  }

  await db.insert(ngosTable).values({
    userId: user.id,
    name: orgName,
    description: description || null,
    governorate,
    district: district || null,
    phone: phone || null,
    website: website || null,
    status: "active",
    verifiedAt: null,
  } as any);

  const updated = await db.update(usersTable).set({
    displayName: orgName,
    onboardingComplete: true,
    ngoVerificationStatus: "pending",
    updatedAt: new Date(),
  }).where(eq(usersTable.id, user.id)).returning();

  res.json({ success: true, message: "Verification request submitted", user: sessionUser(updated[0], req.mfaVerified ?? false) });
});

// ── Session management ────────────────────────────────────────────────────────

router.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
  const token = req.sessionId;
  if (token) {
    await destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME, getSessionClearCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfClearCookieOptions());
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  res.json({ user: sessionUser(user, req.mfaVerified ?? false) });
});

export default router;
