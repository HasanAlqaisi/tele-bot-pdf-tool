import TelegramBot from "node-telegram-bot-api";
require("dotenv").config();
import ConvertAPI from "convertapi";
import fs from "fs";
import express, { Request, Response } from "express";

const app = express();

app.listen(3000, "0.0.0.0", () => {
  console.log("server is running on port 3000");
});

app.get("/", (_: Request, res: Response) => {
  return res.send("hello world");
});

const convertapi = new ConvertAPI(process.env.PDF_API_SECRET!);

const { TOKEN } = process.env;

const bot = new TelegramBot(TOKEN!, { polling: true });

bot.on("message", async (msg) => {
  if (msg.document) {
    // Get the file info sent by user
    const fileInfo = await bot.getFile(msg.document.file_id);

    // download it
    const originalFile = await bot.downloadFile(
      fileInfo.file_id,
      process.cwd()
    );

    // Compress it
    const result = await convertapi.convert(
      "compress",
      {
        File: originalFile,
      },
      "pdf"
    );

    // Save the compressed file
    const savedFiles = await result.saveFiles(process.cwd());

    // Read it as buffer
    const compressedFile = fs.readFileSync(savedFiles[0]);

    // Send the compressed file to the user
    await bot.sendDocument(
      msg.chat.id,
      compressedFile,
      {
        reply_to_message_id: msg.message_id,
      },
      {
        filename: msg.document.file_name + "_compressed",
      }
    );
  }
});
