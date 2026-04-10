import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { usersTable, postsTable, ngosTable, sessionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import {
  FirebaseLoginBody,
  SendWhatsAppOtpBody,
  VerifyWhatsAppOtpBody,
  CompleteProfileBody,
  CompleteNgoProfileBody,
  CreateDraftPostBody,
} from "@workspace/api-zod";

import { verifySupabaseToken } from "../lib/supabase-admin";
import { sendWhatsAppOtp, verifyWhatsAppOtp } from "../lib/whatsapp-otp";
import {
  createSession,
  destroySession,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getSessionClearCookieOptions,
} from "../lib/session";
import { requireAuth } from "../middlewares/auth";
import { rateLimit as customRateLimit } from "../middlewares/rateLimit";
import { rateLimit as expressRateLimit } from "express-rate-limit";
import { logger } from "../lib/logger";
import { getPublicCoordinates } from "../lib/post-location";
import jwt from "jsonwebtoken";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";
import qrcode from "qrcode";

const MFA_JWT_SECRET = process.env.MFA_JWT_SECRET || "default_dev_mfa_secret_do_not_use_in_prod_1234";

const router = Router();
const usersTableWithSupabase = usersTable as typeof usersTable & {
  supabaseUid: unknown;
};
const ngosTableWithUserId = ngosTable as typeof ngosTable & {
  userId: unknown;
};
const loginLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, please try again later." },
});
const sendOtpLimiter = customRateLimit(
  15 * 60 * 1000,
  5,
  "Too many OTP requests, please try again later.",
);
const verifyOtpLimiter = customRateLimit(
  15 * 60 * 1000,
  10,
  "Too many verification attempts, please try again later.",
);
const mfaLimiter = customRateLimit(
  15 * 60 * 1000,
  10,
  "Too many MFA attempts, please try again later.",
);

// ── Firebase Email-Link Login ─────────────────────────────────────────────────

router.post("/auth/supabase-login", loginLimiter, async (req: Request, res: Response) => {
  const parsed = FirebaseLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: String(parsed.error) });
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
    if (email_verified && !user.emailVerified) {
      await db.update(usersTable).set({
        emailVerified: true,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, user.id));
      user = { ...user, emailVerified: true };
    }
  }

  // 2. Claim draft post if draftToken was provided
  if (draftToken) {
    await db.update(postsTable).set({
      userId: user.id,
      draftToken: null,
      status: "active",
      lastConfirmedAt: new Date(),
      updatedAt: new Date(),
    }).where(
      and(
        eq(postsTable.draftToken, draftToken),
        eq(postsTable.status, "pending"),
      )
    );
    logger.info({ userId: user.id }, "Draft post claimed after email-link sign-in");
  }

  // 3. Create session (Always, even for admins)
  const token = await createSession(user.id, req.ip, req.headers["user-agent"]);

  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  res.json({
    status: "success",
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      accountType: user.accountType,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      emailVerified: user.emailVerified,
      whatsappVerified: user.whatsappVerified,
      ngoVerificationStatus: user.ngoVerificationStatus,
      mfaEnabled: user.mfaEnabled,
    },
    isNew,
  });
});

// ── Admin MFA Flow ────────────────────────────────────────────────────────────

router.get("/auth/mfa-setup", requireAuth, async (req: Request, res: Response) => {
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

router.post("/posts/draft", async (req: Request, res: Response) => {
  const parsed = CreateDraftPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: String(parsed.error) });
    return;
  }

  const draftToken = crypto.randomBytes(32).toString("hex");
  const draftData = parsed.data as typeof parsed.data & {
    providedLat?: number;
    providedLng?: number;
  };
  const { publicLat, publicLng } = getPublicCoordinates(
    draftData.postType,
    draftData.governorate,
    draftData.district ?? null,
    draftData.providedLat ?? null,
    draftData.providedLng ?? null,
    draftData.providerType ?? null,
  );

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
    privateLat: draftData.providedLat ?? null,
    privateLng: draftData.providedLng ?? null,
    exactAddressPrivate: parsed.data.exactAddressPrivate ?? null,
    providerType: parsed.data.providerType ?? null,
    contactMethod: parsed.data.contactMethod ?? null,
    contactInfo: parsed.data.contactInfo ?? null,
    status: "pending",
    draftToken,
    userId: null,
    expiresAt,
  }).returning();

  res.status(201).json({ draftToken, postId: post.id });
});

// ── WhatsApp OTP (NGO verification only) ──────────────────────────────────────

router.post("/auth/send-whatsapp-otp", requireAuth, sendOtpLimiter, async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.accountType !== "ngo") {
    res.status(403).json({ error: "WhatsApp verification is only available for NGO accounts" });
    return;
  }

  const parsed = SendWhatsAppOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  try {
    await sendWhatsAppOtp(parsed.data.phone);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to send WhatsApp OTP");
    res.status(500).json({ error: "Failed to send WhatsApp verification" });
  }
});

router.post("/auth/verify-whatsapp-otp", requireAuth, verifyOtpLimiter, async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.accountType !== "ngo") {
    res.status(403).json({ error: "WhatsApp verification is only available for NGO accounts" });
    return;
  }

  const parsed = VerifyWhatsAppOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  try {
    const isValid = await verifyWhatsAppOtp(parsed.data.phone, parsed.data.code);
    if (!isValid) {
      res.status(401).json({ error: "Invalid verification code" });
      return;
    }

    // Mark user as WhatsApp-verified and store their phone
    await db.update(usersTable).set({
      phone: parsed.data.phone,
      whatsappVerified: true,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    res.json({ success: true, whatsappVerified: true });
  } catch (err) {
    logger.error({ err }, "WhatsApp verification check failed");
    res.status(500).json({ error: "Verification check failed" });
  }
});

// ── Profile Completion ────────────────────────────────────────────────────────

router.post("/auth/complete-profile", requireAuth, async (req: Request, res: Response) => {
  const parsed = CompleteProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  const user = req.user!;
  const updated = await db.update(usersTable).set({
    displayName: parsed.data.displayName,
    onboardingComplete: true,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, user.id)).returning();

  res.json({ success: true, user: updated[0] });
});

router.post("/auth/complete-ngo-profile", requireAuth, async (req: Request, res: Response) => {
  const parsed = CompleteNgoProfileBody.safeParse(req.body);
  if (!parsed.success) {
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
    eq(ngosTableWithUserId.userId as never, user.id)
  ).limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "An NGO profile already exists for this user." });
    return;
  }

  const { orgName, description, governorate, phone, website } = parsed.data;

  await db.insert(ngosTable).values({
    userId: user.id,
    name: orgName,
    description: description || null,
    governorate,
    district: null,
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

  res.json({ success: true, message: "Verification request submitted", user: updated[0] });
});

// ── Session management ────────────────────────────────────────────────────────

router.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
  const token = req.sessionId;
  if (token) {
    await destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME, getSessionClearCookieOptions());
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      accountType: user.accountType,
      role: user.role,
      avatarUrl: user.avatarUrl,
      onboardingComplete: user.onboardingComplete,
      emailVerified: user.emailVerified,
      whatsappVerified: user.whatsappVerified,
      ngoVerificationStatus: user.ngoVerificationStatus,
      mfaEnabled: user.mfaEnabled,
    }
  });
});

export default router;
