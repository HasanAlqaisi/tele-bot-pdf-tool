import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import ConvertAPI from "convertapi";

const acceptedMimeTypes = ["application/pdf"];

export default async (
  msg: TelegramBot.Message,
  bot: TelegramBot,
  convertapi: ConvertAPI
) => {
  const { document, chat } = msg;

  if (document) {
    if (acceptedMimeTypes.includes(document.mime_type ?? "")) {
      try {
        // Get the file info sent by user
        const fileInfo = await bot.getFile(document.file_id);

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

        // Naming the compressed file
        const compressedFileName = document.file_name?.replace(
          ".pdf",
          "_compressed"
        );

        // Send the compressed file to the user
        await bot.sendDocument(chat.id, compressedFile, undefined, {
          filename: compressedFileName,
        });

        // Delete the files from storage
        if (fs.existsSync(originalFile)) fs.unlinkSync(originalFile);

        savedFiles.forEach(
          (path) => fs.existsSync(path) && fs.unlinkSync(path)
        );
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
  }
};
