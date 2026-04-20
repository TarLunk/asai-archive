import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
const SITE_DOMAIN = process.env.SITE_DOMAIN

export default class NodemailerService {
  transporter: nodemailer.Transporter<any>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      logger: true,
      debug: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      dkim: {
        domainName: SITE_DOMAIN
        , keySelector: 'server'
        , privateKey: fs.readFileSync(path.join(__dirname, "../../../", "/certificates/dkim/privatekey." + process.env.ENV_PATH + ".pem"), "utf8")
      }
    });
    this.transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages - " + success);
      }
    });
  }
  async sendLimitAlert(email: string) {
    try {
      await this.transporter.sendMail({
        from: `"Сервер" <no-reply@${SITE_DOMAIN}>`,
        to: email,
        subject: 'У вашего бота заканчиваются токены',
        text: 'Добрый день! У вашего AI бота заканчиваются токены. Когда они подойдут к концу, ваш бот будет отключен.',
        html: 'Добрый день! У вашего AI бота заканчиваются токены. Когда они подойдут к концу, ваш бот будет отключен.',
      });
      return true;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}