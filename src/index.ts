import TelegramBot from "node-telegram-bot-api";
require("dotenv").config();
import express from "express";
import compressPdf from "./compress-pdf";
import ConvertAPI from "convertapi";
import convertWordToPdf from "./convert-word-to-pdf";
import convertPptxToPdf from "./convert-pptx-to-pdf";
import { Commands } from "./utils";

const app = express();

const port = parseInt(process.env.PORT as string, 10) || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("server is running on port 3000");
});

const { TOKEN } = process.env;

const bot = new TelegramBot(TOKEN!, { polling: true });

const convertapi = new ConvertAPI(process.env.PDF_API_SECRET!);

let lastCommand: Commands;

bot.onText(/\/compress/, (_, __) => {
  lastCommand = Commands.COMPRESS;
});

bot.onText(/\/wordtopdf/, (_, __) => {
  lastCommand = Commands.WORDTOPDF;
});

bot.onText(/\/powerpointtopdf/, (_, __) => {
  lastCommand = Commands.PPTXTOPDF;
});

bot.on("message", async (msg) => {
  switch (lastCommand) {
    case Commands.COMPRESS:
      await compressPdf(msg, bot, convertapi);
      break;
    case Commands.WORDTOPDF:
      await convertWordToPdf(msg, bot, convertapi);
      break;
    case Commands.PPTXTOPDF:
      await convertPptxToPdf(msg, bot, convertapi);
      break;
    default:
      break;
  }
});
