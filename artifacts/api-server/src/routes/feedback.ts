import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import * as dbSchema from "@workspace/db/schema";

const router: IRouter = Router();

// Rate limit feedback submissions to prevent spam/abuse
const feedbackRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 feedback requests per `window` (here, per 15 minutes)
  message: { error: "Too many feedback submissions from this IP, please try again after 15 minutes." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const { feedbacksTable, insertFeedbackSchema } = dbSchema as unknown as {
  feedbacksTable: unknown;
  insertFeedbackSchema: { parse: (input: unknown) => unknown };
};

router.post("/feedback", feedbackRateLimiter, async (req, res) => {
  try {
    const data = insertFeedbackSchema.parse(req.body) as Record<string, unknown>;
    await db.insert(feedbacksTable as never).values(data as never);

    // Send to Slack if webhook URL is configured
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      const slackText = [
        "🚨 *New Feedback Received!* 🚨",
        `*Type:* ${data.type}`,
        `*Name:* ${data.name || "Anonymous"}`,
        `*Email:* ${data.email || "N/A"}`,
        `*Message:* ${data.message}`
      ].join("\n");

      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: slackText }),
      }).catch((err) => {
        console.error("Failed to send Slack webhook:", err);
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    res.status(400).json({ error: "Failed to submit feedback" });
  }
});

export default router;
