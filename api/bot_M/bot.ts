import { Bot } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize the bot
const token = process.env.BOT_M_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);

async function initializeBot() {
  await bot.init();
}

// Bot logic
bot.on("message:text", (ctx) => ctx.reply("You wrote: " + ctx.message.text));

// Handler for Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "POST") {
      // Ensure bot is initialized
      await initializeBot();

      // Read the request body
      const body = await readBody(req);
      
      // Parse the body to JSON
      const update = JSON.parse(body);    


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
async function readBody(request: VercelRequest): Promise<string> {
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

 