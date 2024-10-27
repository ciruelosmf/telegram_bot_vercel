import { Bot, webhookCallback } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the bot
const token = process.env.BOT_M_TOKEN;
const googleApiKey = process.env.GOOGLE_API_KEY;

if (!token) throw new Error("BOT_TOKEN is unset");
if (!googleApiKey) throw new Error("GOOGLE_API_KEY is unset");

const bot = new Bot(token);

// Initialize Google AI
const genAI = new GoogleGenerativeAI(googleApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to generate AI response
async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I couldn't generate a response at the moment. Please try again later.";
  }
}

// Bot handlers
bot.command("start", (ctx) => ctx.reply("Welcome! I'm an AI-powered bot. Send me a message and I'll respond with AI-generated content."));

bot.on("message:text", async (ctx) => {
  try {
    console.log('Received message:', ctx.message.text);
    
    // Show typing indicator while generating response
    await ctx.replyWithChatAction("typing");
    
    // Generate AI response
    const aiResponse = await generateAIResponse(ctx.message.text);
    
    // Send the response
    return ctx.reply(aiResponse, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error('Error handling message:', error);
    return ctx.reply("Sorry, there was an error processing your message. Please try again.");
  }
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