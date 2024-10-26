import { Bot } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize the bot only once
const token = process.env.BOT_M_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);
console.log("Processing webhook:");

// Register the webhook URL with Telegram (done manually or on initial setup)
// bot.api.setWebhook("https://your-vercel-url/api/bot");

// Bot logic
bot.on("message:text", (ctx) => ctx.reply("You wrote: " + ctx.message.text));

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "POST") {
      // Process the update
      await bot.handleUpdate(req.body);

      // Respond with success
      res.status(200).send("OK");
    } else {
      // Respond to non-POST requests
      res.status(200).json({ message: "Bot is running" });
    }
  } catch (e) {
    console.error("Error processing webhook:", e);
    res.status(500).send("Internal Server Error");
  }
}
