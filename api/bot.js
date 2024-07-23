
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
    // Read the request body as a buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse the buffer to JSON
    let body;
    try {
      body = JSON.parse(buffer.toString());
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return res.status(400).send("Bad Request: Invalid JSON");
    }

    // Create a new request object with the parsed body
    const mockReq = {
      method: req.method,
      headers: req.headers,
      body: body,
    };

    // Process the webhook update
    try {
      await webhookCallback(bot, "std/http")(mockReq, res);
    } catch (e) {
      console.error("Error processing webhook:", e);
      return res.status(500).send("Internal Server Error");
    }
  } else {
    // Respond to non-POST requests
    res.status(200).json({ message: "Bot is running" });
  }
}

 
/**
bot.on("message", async (ctx) => {
    await ctx.reply("I got your message!");
  });

  
export default webhookCallback(bot, "std/http");


 


   */

 