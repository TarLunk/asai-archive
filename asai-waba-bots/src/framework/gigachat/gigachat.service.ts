import { Message } from "@src/domain/types";
import axios from 'axios';
import * as https from 'https' ;
import * as path from 'path';
import * as fs from 'fs';

export default class GigachatService {
  apiKey: string;
  apiUrl: string;
  rqUid: string;
  oauthUrl: string;
  accessToken: string | null;  // Сохраняем токен для повторного использования

  constructor() {
    this.apiKey = process.env.GIGACHAT_API_KEY ?? '';
    this.rqUid = process.env.GIGACHAT_UUID4 ?? '';
    this.apiUrl = 'https://gigachat.devices.sberbank.ru/api/v1/chat';
    this.oauthUrl = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
    this.accessToken = null;  // Изначально токен отсутствует
  }

  // Метод для получения AccessToken
  async getAccessToken(): Promise<string> {
    try {
      const certPath = fs.readFileSync(path.join(__dirname, "../../../", "/certificates/dkim/", 'russiantrustedca.pem'));
      const response = await axios.post(
        this.oauthUrl,
        {
          scope: 'GIGACHAT_API_CORP'
        }, // Пример тела запроса, можешь изменить в зависимости от требований
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': this.rqUid,
            'Authorization': 'Basic '+this.apiKey
          },
          httpsAgent: new https.Agent({
            ca: certPath
          }),
          maxBodyLength: Infinity,
        }
      );

      const token = response.data.access_token;
      this.accessToken = token;  // Сохраняем токен в поле класса
      return token;
    } catch (error: any) {
      console.log(error)
      throw new Error(`Failed to get AccessToken: ${error?.message}`);
    }
  }

  // Метод для отправки запроса к Gigachat API с обработкой ошибки 400
  async getAnswer(model: string, context: Message[], systemPropt: string, userPropmt: string, params: {  temperature?: number } = {}): Promise<{ content: string, tokens: number }> {
    const {temperature = 1 } = params;
    const messages = context.map((msg) => {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      return { content: msg.content, role };
    });

    const gptMessages = [
      { role: 'system', content: systemPropt },
      ...messages,
      { role: 'user', content: userPropmt },
    ];

    console.log(gptMessages);

    // Проверка и получение токена перед отправкой запроса, если токен отсутствует
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      return await this._sendRequestToGigachat(model, gptMessages, this.accessToken!, temperature);
    } catch (error: any) {
      // Если ошибка 400, запрашиваем новый токен и повторяем запрос
      if (error.response && error.response.status === 401) {
        console.log("AccessToken expired or invalid, refreshing token...");

        // Запрашиваем новый AccessToken
        await this.getAccessToken();

        // Повторяем запрос с новым AccessToken
        return await this._sendRequestToGigachat(model, gptMessages, this.accessToken!, temperature);
      } else {
        throw new Error(`Gigachat API request failed: ${error?.message}`);
      }
    }
  }

  // Вспомогательный метод для отправки запроса к Gigachat API
  private async _sendRequestToGigachat(model: string, messages: any[], token: string, temperature: number): Promise<{ content: string, tokens: number }> {
    try {
      const response = await axios.post(
        this.apiUrl + "/completions",
        {
          model,
          messages,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,  // Используем токен
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        }
      );

      const openaiRes = response.data;
      return { content: openaiRes.choices[0].message.content, tokens: openaiRes.usage.total_tokens };
    } catch (error: any) {
      throw error;  // Пробрасываем ошибку для обработки в getAnswer
    }
  }
}