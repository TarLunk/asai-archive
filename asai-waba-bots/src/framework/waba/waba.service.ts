import axios, { AxiosError } from "axios";

export default class WabaService {
    constructor() {
    }

    async sendMessage(phoneNumberId: string, apiAccessToken: string, to: string, text: string): Promise<any> {
        const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
        const headers = {
            Authorization: `Bearer ${apiAccessToken}`,
            'Content-Type': 'application/json',
        };

        const body = {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
        };

        try {
            const response = await axios.post(url, body, { headers });
            return response.data;
        } catch (error: any) {
            if (error.isAxiosError && error.response) {
                console.error(error.response.data);
            } else {
                console.error(typeof error);
            }
            throw error;
        }
    }
}