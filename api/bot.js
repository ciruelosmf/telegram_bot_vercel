import { Bot } from "grammy";

// Initialize the bot
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);

// Bot logic
bot.command("start", (ctx) => ctx.reply("Welcome! I'm your Telegram bot."));
bot.on("message", (ctx) => ctx.reply("I received your message!"));

// Handler for Vercel serverless function
export default async function handler(request) {
  try {
    if (request.method === "POST") {
      // Read the request body
      const body = await readBody(request);
      
      // Parse the body to JSON
      const update = JSON.parse(body);

      // Process the update
      await bot.handleUpdate(update);

      // Respond with success
      return new Response("OK", { status: 200 });
    } else {
      // Respond to non-POST requests
      return new Response(JSON.stringify({ message: "Bot is running" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("Error processing webhook:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Helper function to read request body
async function readBody(request) {
  const buffers = [];
  for await (const chunk of request.body) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers).toString();
}

// Configuration for Edge Runtime
export const config = {
  runtime: "edge",
};

 
/**
bot.on("message", async (ctx) => {
    await ctx.reply("I got your message!");
  });

  
export default webhookCallback(bot, "std/http");


 


   */

 