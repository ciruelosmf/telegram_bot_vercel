import { Bot, webhookCallback } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fetch from "node-fetch";

// Initialize the bot and API keys
const token = process.env.BOT_F_TOKEN;
const googleApiKey = process.env.GOOGLE_API_KEY;

if (!token) throw new Error("BOT_TOKEN is unset");
if (!googleApiKey) throw new Error("GOOGLE_API_KEY is unset");

const bot = new Bot(token);

// Initialize Google AI and File Manager
const genAI = new GoogleGenerativeAI(googleApiKey);
const fileManager = new GoogleAIFileManager(googleApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to download image from Telegram and save as buffer
async function downloadTelegramImage(fileUrl: string): Promise<Buffer> {
  const response = await fetch(fileUrl);
  return Buffer.from(await response.arrayBuffer());
}

// Helper function to generate AI response for text
async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I couldn't generate a response at the moment. Please try again later.";
  }
}

// Helper function to generate AI response for images using File API
async function generateImageResponse(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    // Upload the image using File API
    const uploadResult = await fileManager.uploadFile(imageBuffer, {
      mimeType: mimeType,
      displayName: `telegram_image_${Date.now()}`,
    });

    console.log(`Uploaded file as: ${uploadResult.file.uri}`);

    // Generate content using the uploaded file
    const result = await model.generateContent([
      "Analyze and describe this image in detail.",
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Error generating image response:', error);
    return "Sorry, I couldn't analyze the image at the moment. Please try again later.";
  }
}

// Bot handlers
bot.command("start", (ctx) => ctx.reply(
  "Welcome! I'm an AI-powered bot. You can:\n" +
  "1. Send me a text message for an AI response\n" +
  "2. Send me an image to analyze it"
));

// Handle text messages
bot.on("message:text", async (ctx) => {
  try {
    console.log('Received text message:', ctx.message.text);
    await ctx.replyWithChatAction("typing");
    const aiResponse = await generateAIResponse(ctx.message.text);
    return ctx.reply(aiResponse, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error('Error handling text message:', error);
    return ctx.reply("Sorry, there was an error processing your message. Please try again.");
  }
});

// Handle photo messages
bot.on("message:photo", async (ctx) => {
  try {
    console.log('Received photo message');
    await ctx.replyWithChatAction("typing");

    // Get the photo file ID (highest quality version)
    const photoFile = ctx.message.photo[ctx.message.photo.length - 1];
    
    // Get file info including download URL
    const file = await ctx.api.getFile(photoFile.file_id);
    if (!file.file_path) {
      throw new Error("Couldn't get file path");
    }

    // Download the image
    const imageBuffer = await downloadTelegramImage(
      `https://api.telegram.org/file/bot${token}/${file.file_path}`
    );

    // Generate response using the File API
    const aiResponse = await generateImageResponse(imageBuffer, 'image/jpeg');

    return ctx.reply(aiResponse, {
      parse_mode: "Markdown",
      reply_to_message_id: ctx.message.message_id
    });
  } catch (error) {
    console.error('Error handling photo message:', error);
    return ctx.reply(
      "Sorry, there was an error processing your image. Please try again.",
      { reply_to_message_id: ctx.message.message_id }
    );
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
      await handleWebhook(req, res);
    } else if (req.method === "GET") {
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