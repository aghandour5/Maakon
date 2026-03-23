import crypto from "node:crypto";
import { logger } from "./logger";

const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_RATE_LIMIT_HOUR = 5;

/**
 * Generates a purely numeric 6-digit OTP code using crypto.
 */
export function generateOtp(): string {
  // Use crypto.webcrypto or randomInt for cryptographically secure OTP
  // For a 6-digit code, the max is 999999
  const num = crypto.randomInt(0, 1000000);
  return num.toString().padStart(OTP_LENGTH, "0");
}

/**
 * Hashes an OTP code for safe storage using SHA-256.
 */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Sends an OTP to a phone number. 
 * If DEV_OTP_BYPASS is set, it only logs the OTP to the console instead of sending an SMS.
 */
export async function sendOtp(phone: string, code: string): Promise<void> {
  const isDevBypass = process.env["DEV_OTP_BYPASS"] === "true";

  if (isDevBypass) {
    logger.info({ phone, code }, "DEV_OTP_BYPASS is enabled: SMS sending skipped. Use this code.");
    return;
  }

  // TODO: Implement actual SMS provider here (e.g. Twilio)
  // Example Twilio Implementation:
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: `Your Maakon verification code is: ${code}`,
  //   from: process.env.TWILIO_FROM_NUMBER,
  //   to: phone
  // });
  
  logger.warn({ phone }, "sendOtp: Real SMS provider not yet integrated. Falling back to console log.");
  logger.info({ phone, code }, "OTP Code:");
}
