import { Bot, webhookCallback } from "grammy";

// Initialize the bot
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);

// Bot logic
bot.command("start", (ctx) => ctx.reply("Welcome! I'm your Telegram bot."));
bot.on("message", (ctx) => ctx.reply("I received your message!"));

// Handler for Vercel serverless function
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Read the request body
      const body = await readBody(req);
      
      // Parse the body to JSON
      const update = JSON.parse(body);

      // Process the update
      await bot.handleUpdate(update);

      // Respond with success
      res.status(200).send("OK");
    } catch (e) {
      console.error("Error processing webhook:", e);
      res.status(500).send("Internal Server Error");
    }
  } else {
    // Respond to non-POST requests
    res.status(200).json({ message: "Bot is running" });
  }
}

// Helper function to read request body
async function readBody(req) {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers).toString();
}

// If using Node.js 18 or later, you can use this config.
// If it causes issues, you can remove it.
export const config = {
  runtime: "edge",
};

 
/**
bot.on("message", async (ctx) => {
    await ctx.reply("I got your message!");
  });

  
export default webhookCallback(bot, "std/http");


 


   */

 