import { Bot, webhookCallback } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the bot
const token = process.env.BOT_M_TOKEN;
const googleApiKey = process.env.GOOGLE_API_KEY;
const otherBotUsername = "Justin_LovAct_bot"; // e.g., "@other_bot"

if (!token) throw new Error("BOT_TOKEN is unset");
if (!googleApiKey) throw new Error("GOOGLE_API_KEY is unset");
if (!otherBotUsername) throw new Error("OTHER_BOT_USERNAME is unset");

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
    return "Sorry, I couldn't generate a response at the moment.";
  }
}

// Bot handlers
bot.command("start", (ctx) => {
  if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
    return ctx.reply("I'm ready to chat in this group! Use /startconvo to begin a conversation.");
  }
  return ctx.reply("Please add me to a group chat to use my features.");
});

bot.command("startconvo", async (ctx) => {
  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return ctx.reply("This command only works in group chats.");
  }
  
  await ctx.reply("Starting a conversation...");
  const initialMessage = "Hello everyone! Let's have a conversation!";
  const aiResponse = await generateAIResponse(initialMessage);
  await ctx.reply(aiResponse);
});

// Handle messages in group
bot.on("message:text", async (ctx) => {
  // Only process in group chats
  if (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup") {
    return;
  }

  try {
    const message = ctx.message;
    const fromBot = message.reply_to_message?.from?.is_bot;
    const repliedToUsername = message.reply_to_message?.from?.username;
    const isReplyToOtherBot = repliedToUsername === otherBotUsername.replace("@", "");
    const myUsername = ctx.me.username;
    
    // Check if message is a reply to the other bot
    if (fromBot && isReplyToOtherBot) {
      // Show typing indicator
      await ctx.replyWithChatAction("typing");

      // Generate and send response
      const aiResponse = await generateAIResponse(message.text);
      await ctx.reply(aiResponse, {
        reply_to_message_id: message.message_id
      });
    }
    
    // Handle direct mentions of this bot
    if (message.text.includes(`@${myUsername}`)) {
      await ctx.replyWithChatAction("typing");
      const aiResponse = await generateAIResponse(message.text);
      await ctx.reply(aiResponse, {
        reply_to_message_id: message.message_id
      });
    }

  } catch (error) {
    console.error('Error in message handler:', error);
    await ctx.reply("Sorry, there was an error processing the message.");
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
  try {
    if (req.method === "POST") {
      await handleWebhook(req, res);
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