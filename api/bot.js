

import { Bot, webhookCallback } from "grammy";
console.log(1);


const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

const bot = new Bot(token);
bot.command("start", (ctx) => ctx.reply("Welcome! Bot is running."));
bot.on("message:text", (ctx) => ctx.reply("Echo: " + ctx.message.text));
export default webhookCallback(bot, "std/http");


 



 