import { Bot } from "grammy";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Initialize the bot
const token = process.env.BOT_M_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// Create bot instance outside the handler to maintain connection
const bot = new Bot(token);

// Handler for Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Log incoming request details
    console.log(`Received ${req.method} request to ${req.url}`);
    
    if (req.method === "POST") {
      // Get the raw body
      const rawBody = await readBody(req);
      console.log('Received webhook payload:', rawBody);
      
      try {
        const update = JSON.parse(rawBody);
        console.log('Parsed update:', update);
        
        // Handle the update
        await bot.handleUpdate(update);
        console.log('Update processed successfully');
        
        res.status(200).json({ success: true });
      } catch (parseError) {
        console.error('Error parsing webhook payload:', parseError);
        res.status(400).json({ 
          error: 'Invalid payload',
          details: parseError.message 
        });
      }
    } else if (req.method === "GET") {
      // Health check endpoint
      res.status(200).json({ 
        status: 'active',
        timestamp: new Date().toISOString()
      });
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

// Improved body reader with timeout
async function readBody(request: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request body reading timed out'));
    }, 5000); // 5 second timeout

    let body = '';
    
    request.on('data', chunk => {
      body += chunk.toString();
    });
    
    request.on('end', () => {
      clearTimeout(timeout);
      resolve(body);
    });
    
    request.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Setup bot handlers
bot.command("start", (ctx) => ctx.reply("Welcome! Bot is active."));
bot.on("message:text", (ctx) => {
  console.log('Received message:', ctx.message.text);
  return ctx.reply(`You wrote: ${ctx.message.text}`);
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});