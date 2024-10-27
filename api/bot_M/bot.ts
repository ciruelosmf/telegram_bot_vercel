import { Bot, webhookCallback } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize the bot
const token = process.env.BOT_M_TOKEN;
if (!token) throw new Error("BOT_TOKEN is usnset");

const bot = new Bot(token);

// Bot handlers
bot.command("start", (ctx) => ctx.reply("Welcome! Bot is active."));
bot.on("message:text", (ctx) => {
  console.log('Received message:', ctx.message.text);
  return ctx.reply(`You wrote: ${ctx.message.text}`);
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Create the webhook callback handler
const handleWebhook = webhookCallback(bot, "http");

// Handler for Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`Received ${req.method} request to ${req.url}`);

  try {
    if (req.method === "POST") {
      // Handle the webhook
      await handleWebhook(req, res);
    } else if (req.method === "GET") {
      // Health check and webhook info
      try {
        const webhookInfo = await bot.api.getWebhookInfo();
        res.status(200).json({ 
          status: 'active',
          webhook: webhookInfo,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error getting webhook info:', error);
        res.status(500).json({ error: 'Failed to get webhook info' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    console.error('Unhandled error:', e);
    res.status(500).json({ 
      error: 'Internal server error',
      details: e.message 
    });
  }
}