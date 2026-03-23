/**
 * whatsapp-otp.ts — sends and verifies WhatsApp OTP via Twilio Verify.
 *
 * Requires:
 *  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
 *
 * In dev mode with DEV_WHATSAPP_BYPASS=true, OTP is logged to console
 * and verification always returns true for code "123456".
 */
import { logger } from "./logger";

const isDevWhatsAppBypassEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env["DEV_WHATSAPP_BYPASS"] === "true";

function redactPhone(phone: string): string {
  if (phone.length <= 6) {
    return "***";
  }

  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

if (
  process.env.NODE_ENV === "production" &&
  process.env["DEV_WHATSAPP_BYPASS"] === "true"
) {
  logger.warn("Ignoring DEV_WHATSAPP_BYPASS because NODE_ENV=production");
}

/**
 * Sends a WhatsApp OTP to the given phone number using Twilio Verify.
 */
export async function sendWhatsAppOtp(phone: string): Promise<{ success: boolean }> {
  if (isDevWhatsAppBypassEnabled) {
    logger.info(
      { phone: redactPhone(phone) },
      "DEV_WHATSAPP_BYPASS: would send WhatsApp OTP. Use code 123456.",
    );
    return { success: true };
  }

  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const serviceSid = process.env["TWILIO_VERIFY_SERVICE_SID"];

  if (!accountSid || !authToken || !serviceSid) {
    logger.error("Missing Twilio credentials for WhatsApp OTP");
    throw new Error("WhatsApp OTP service not configured");
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  const verification = await client.verify.v2
    .services(serviceSid)
    .verifications.create({
      to: phone,
      channel: "whatsapp",
    });

  logger.info(
    { phone: redactPhone(phone), status: verification.status },
    "WhatsApp OTP sent",
  );
  return { success: verification.status === "pending" };
}

/**
 * Verifies a WhatsApp OTP code for the given phone number.
 */
export async function verifyWhatsAppOtp(phone: string, code: string): Promise<boolean> {
  if (isDevWhatsAppBypassEnabled) {
    logger.info(
      { phone: redactPhone(phone) },
      "DEV_WHATSAPP_BYPASS: checking code",
    );
    return code === "123456";
  }

  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const serviceSid = process.env["TWILIO_VERIFY_SERVICE_SID"];

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("WhatsApp OTP service not configured");
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  const check = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({
      to: phone,
      code,
    });

  return check.status === "approved";
}
