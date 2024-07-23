

import { Bot, webhookCallback } from "grammy";
console.log(1);


const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

const bot = new Bot(token);

/**
bot.on("message", async (ctx) => {
    await ctx.reply("I got your message!");
  });

  
export default webhookCallback(bot, "std/http");


 


   */

 