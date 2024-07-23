import { Bot } from "grammy";

// Initialize the bot
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);

// Bot logic
bot.command("start", (ctx) => ctx.reply("Welcome! I'm your Telegram bot."));
bot.on("message", (ctx) => ctx.reply("I received your message!"));

// Handler for Vercel serverless function
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      // Read the request body
      const body = await readBody(req);
      
      // Parse the body to JSON
      const update = JSON.parse(body);

      // Initialize the bot if not already initialized
      if (!bot.isInited) {
        await bot.init();
        bot.isInited = true; // Mark the bot as initialized
      }

      // Process the update
      await bot.handleUpdate(update);

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

// Helper function to read request body
async function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    request.on('end', () => {
      resolve(body);
    });
    request.on('error', (err) => {
      reject(err);
    });
  });
}








 
/**
bot.on("message", async (ctx) => {
    await ctx.reply("I got your message!");
  });

  
export default webhookCallback(bot, "std/http");


 


   */

 