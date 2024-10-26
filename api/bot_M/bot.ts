import { Bot } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize the bot only once
const token = process.env.BOT_M_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const bot = new Bot(token);
console.log("Processing webhook:");

// Bot logic
bot.on("message:text", (ctx) => ctx.reply("You wrote: " + ctx.message.text));

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Request method:", req.method); // Log the method for debugging
  if (req.method === "POST") {
    try {
      // Check if the request body is JSON
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log("Received body:", body); // Log the body for debugging
      await bot.handleUpdate(body); // Process the update
      res.status(200).send("OK"); // Respond with success
    } catch (error) {
      console.error("Error handling update:", error);
      res.status(500).send("Error processing update");
    }
  } else {
    // Respond to non-POST requests
    console.log("Non-POST request received:", req.method);
    res.status(405).send(`Method ${req.method} Not Allowed`);
  }
}
