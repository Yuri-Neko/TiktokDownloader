const TelegramBot = require('node-telegram-bot-api');
const { ttdl } = require('ridwanz-downloader');
const express = require('express');
const chalk = require('chalk');
const util = require('util');

const { telegramBotToken } = require('./settings.js');

const bot = new TelegramBot(telegramBotToken, { polling: true });
const app = express();
const port = process.env.PORT || 3000;
let botStartTime = new Date();

const sleep = util.promisify(setTimeout);

app.use(express.json());

app.post(`/bot${telegramBotToken}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Bot Telegram sedang berjalan!');
});

bot.onText(/^\/runtime$/, (msg) => {
  const now = new Date();
  bot.sendChatAction(msg.chat.id, 'typing');
  const uptimeMilliseconds = now - botStartTime;
  const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60) % 60;
  const uptimeHours = Math.floor(uptimeSeconds / 3600) % 24;
  const uptimeDays = Math.floor(uptimeSeconds / 86400);

  const uptimeMessage = `Bot Aktif Selama:\n${uptimeDays} hari ${uptimeHours} jam ${uptimeMinutes} menit ${uptimeSeconds % 60} detik.`;

  bot.sendMessage(msg.chat.id, uptimeMessage);
});

bot.onText(/^\/owner$/, (msg) => {
  bot.sendChatAction(msg.chat.id, 'typing');
  const ownerMessage = '@RidwanzSaputra';
  bot.sendMessage(msg.chat.id, ownerMessage);
});

bot.onText(/^\/start$/, (msg) => {
  bot.sendChatAction(msg.chat.id, 'typing');
  const caption = `
Kirimkan URL Video TikTok Yang Ingin Anda Unduh!`;
  bot.sendMessage(msg.chat.id, caption);
});

bot.on('message', async (msg) => {
  const body = /^https:\/\/.*tiktok\.com\/.+/;
  if (body.test(msg.text)) {
    const url = msg.text;
    try {
      bot.sendChatAction(msg.chat.id, 'upload_video');
      const data = await ttdl(url, { quality: 'high' });
      const audio = data.audio[0];
      const { title, title_audio } = data;
      await bot.sendVideo(msg.chat.id, data.video[0], { caption: title });
      bot.sendChatAction(msg.chat.id, 'upload_audio');
      await sleep(1000);
      await bot.sendAudio(msg.from.id, audio, { caption: title_audio });
   
    } catch (error) {
      bot.sendChatAction(msg.chat.id, 'typing');
      bot.sendMessage(msg.chat.id, 'Maaf, Terjadi Kesalahan Saat Mengunduh Video TikTok.');
      console.error(chalk.red(`[ ERROR ] ${msg.chat.id}: ${error.message}`));
    }
  }
});

app.listen(port, () => {
  console.log(`Bot berjalan di port ${port}`);
});