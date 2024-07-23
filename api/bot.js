

import { Bot, webhookCallback } from "grammy";

// Initialize the bot
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);

// Bot logic
bot.on("message", async (ctx) => {
  await ctx.reply("I got your message!");
});

// Handler for Vercel serverless function
export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = await getRawBody(req);
    try {
      await webhookCallback(bot, "std/http")(
        {
          body,
          headers: req.headers,
          method: req.method,
          url: req.url,
        },
        res
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Webhook handling failed" });
    }
  } else {
    res.status(200).json({ message: "Bot is running" });
  }
}

// Helper function to get raw body as a buffer
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = [];
    req.on("data", (chunk) => body.push(chunk));
    req.on("end", () => resolve(Buffer.concat(body)));
    req.on("error", reject);
  });
}

/**
bot.on("message", async (ctx) => {
    await ctx.reply("I got your message!");
  });

  
export default webhookCallback(bot, "std/http");


 


   */

 