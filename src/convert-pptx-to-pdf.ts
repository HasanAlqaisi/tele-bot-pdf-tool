import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import ConvertAPI from "convertapi";
import path from "path";

export default async (
  msg: TelegramBot.Message,
  bot: TelegramBot,
  convertapi: ConvertAPI
) => {
  const { document, chat } = msg;

  if (document) {
    try {
      // Get the file info sent by user
      const fileInfo = await bot.getFile(document.file_id);

      // download it
      const originalFile = await bot.downloadFile(
        fileInfo.file_id,
        process.cwd()
      );

      // convert it
      const result = await convertapi.convert(
        "pdf",
        {
          File: originalFile,
        },
        "pptx"
      );

      // Save the converted file
      const savedFiles = await result.saveFiles(process.cwd());

      // Read it as buffer
      const convertedFile = fs.readFileSync(savedFiles[0]);

      // get the name of the converted file
      const parsedFile = path.parse(document.file_name ?? "");

      // Send the file to the user
      bot.sendDocument(chat.id, convertedFile, undefined, {
        filename: parsedFile.name + ".pdf",
        contentType: "application/pdf",
      });

      // Delete the saved files from storage
      if (fs.existsSync(originalFile)) fs.unlinkSync(originalFile);

      if (fs.existsSync(savedFiles[0])) fs.unlinkSync(savedFiles[0]);
    } catch (e) {
      const error = e as any;
      if (error.code === "ETELEGRAM") {
        let { description } = error.response.body;

        description = (description as string).split(":")[1];

        await bot.sendMessage(
          chat.id,
          `Sorry ${msg.chat.first_name},${description}`,
          {
            reply_to_message_id: msg.message_id,
          }
        );
      } else {
        console.log(error);
        await bot.sendMessage(
          chat.id,
          `Sorry ${msg.chat.first_name}, something wrong happened :(`,
          {
            reply_to_message_id: msg.message_id,
          }
        );
      }
    }
  }
  return;
};
