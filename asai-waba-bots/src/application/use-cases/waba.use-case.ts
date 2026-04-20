import { IWabaRepository, IDatabaseService, IMailService, IOpenaiService, IProjectRepository, IFuseService, IGPTSearchService, IGigachatService, IVectorStoreService } from "@src/application/ports";
import { checkChatData } from "@src/utils";
import { Message, ParsedAnswer, OpenaiRes, ParsedAction } from "@src/domain/types";

import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
const wabaUseCase = (databaseService: IDatabaseService, openaiService: IOpenaiService, mailService: IMailService, fuseService: IFuseService, gptSearchService: IGPTSearchService, gigachatService: IGigachatService, vectorStoreService: IVectorStoreService) => {
  const wabaRepository: IWabaRepository = databaseService.wabaRepository;
  const projectRepository: IProjectRepository = databaseService.projectRepository;

  const checkWebhook = async (msg: TelegramBot.Message, bot: TelegramBot, token: string) => {

  }
  const sendMessage = async (msg: TelegramBot.Message, bot: TelegramBot, token: string) => {
    let messages: Message[] = [];
    let parsedAnswer: ParsedAnswer;
    let tokens: number = 0;
    let answer: OpenaiRes;
    let savedChatData: ParsedAction[] = [];
    const chats = await wabaRepository.getContextByPhoneId(msg.chat.id, token);
    let selectedLLM = null;
    if (chats[0].gpt_brand === 'gigachat') {
      selectedLLM = gigachatService;
    } else {
      selectedLLM = openaiService;
    }
    if (!chats[0].is_project_active) throw new Error('Чат неактивен');
    if (!chats[0].is_bot_active) throw new Error('Бот неактивен');
    await wabaRepository.createMessage(chats[0].chat_id, "user", msg.text);
    let knowledgeBaseSum = []
    console.log(chats[0].faq)
    if (chats[0].faq) {
      for (let i = 0; i < chats[0].faq.length; i++) {
        const kb = chats[0].faq[i];
        knowledgeBaseSum = knowledgeBaseSum.concat(kb.text)
      }
    }
    const enumArray: string[] = []
    const analyticalSystemPrompt = 'Твоя задача - анализировать сообщения пользователей. Не пытайся отвечать сообщения. Если найдешь в сообщении пользователя triggers из описания - пришли их в массиве согласно инструкции.';
    let analyticalPrompt = '';
    if (chats[0].is_product_base_active && Array.isArray(chats[0].product_base) && chats[0].product_base.length > 0) {
      // isTriggerRequired = true;
      enumArray.push("productBase")
      analyticalPrompt += `
          Правила взаимодействия пользователя с базой данных товаров:
          Если пользователь задает вопрос о наличии или цене любых товаров, добавь в массив: {"trigger": "productBase", "query": "ключевые слова товара"} 
          Никогда не придумывай товары и не ориентируйся на товары из прошлых сообщений. Если ключевые слова стоят во множественном числе, переведи их в единственное число.
          В качестве ключевых слов используй все слова, которыми пользователь называет товар. Все ключевые слова, относящиейся к одному товару, должны быть обязательно объеденены в одну строку. Если описывается насколько товаров, то для каждого искомого товара напиши отдельный JSON.`;
    }
    if (chats[0].is_faq_active && Array.isArray(chats[0].faq) && chats[0].faq.length > 0 && Array.isArray(chats[0].faq[0].text)) {
      // isTriggerRequired = true;
      enumArray.push("knowledgeBase")
      analyticalPrompt += `
          Правила взаимодействия пользователя с базой знаний:
          Ниже перечислены вопросы в виде: (номер вопроса.текст вопроса). 
          Если вопрос пользователя касается одного из перечисленных вопросов, 
          то  добавь в массив: {"trigger": "knowledgeBase", "value":номер вопроса}  
          Список вопросов:`;
      knowledgeBaseSum.map((kb, i) => {
        analyticalPrompt += `${(i)}.${kb.question}`
      })
    }
    if (!chats[0].chat_data_name) {
      // isTriggerRequired = true;
      enumArray.push("chatDataName")
      analyticalPrompt += `
        Личные данные:
        - Если пользователь написал в сообщении свое имя, добавь {"trigger": "chatDataName", "value": имя}.
        - Никогда не придумывай имя. Добавляй его только если оно явно указано и представлено как полное имя в текущем сообщении.`;
    }
    if (!chats[0].chat_data_email) {
      // isTriggerRequired = true;
      enumArray.push("chatDataEmail")
      analyticalPrompt += `
      - Если пользователь написал в сообщении свой email, добавь {"trigger": "chatDataEmail", "value": email}.
      - Никогда не придумывай email. Добавляй его только если он явно указан в текущем сообщении.`;
    }
    if (!chats[0].chat_data_phone) {
      // isTriggerRequired = true;
      enumArray.push("chatDataPhone")
      analyticalPrompt += `
      - Если сообщение написал в сообщении свой корректный номер телефона, добавь {"trigger": "chatDataPhone", "value": телефон}.
      - Никогда не придумывай номер телефона. Добавляй его только если он явно указан в текущем сообщении.`;
    }
    if (analyticalPrompt.length > 0) {
      analyticalPrompt += `
      Если сообщение пользователя не подходит под описанные выше условия, **верни пустой массив "actions"**.  Не добавляй значения, если они не упомянуты в сообщении.`;

      console.log("enumArray: " + enumArray)
      const schema = {
        name: "searching_results",
        schema: {
          type: "object",
          properties: {
            actions: {
              type: "array",
              description: "Founded triggers in user's message",
              items: {
                type: "object",
                properties: {
                  trigger: {
                    type: "string",
                    description: "Trigger name",
                    enum: enumArray,
                  },
                  value: {
                    type: "string",
                    description: "Trigger value",
                  },
                },
                required: ["trigger", "value"],
                additionalProperties: false
              },
            },
          },
          required: ["actions"],
          additionalProperties: false
        },
        strict: true,
      }

      answer = await openaiService.getJsonAnswer(analyticalSystemPrompt, msg.text ?? '', schema, { model: "gpt-4o-mini", context: chats[0].messages });
      tokens += answer.tokens;
      parsedAnswer = JSON.parse(answer.content);
    }
    const checkSchema = {
      name: "checking_results",
      schema: {
        type: "object",
        properties: {
          isCorrect: {
            description: "Founded triggers in user's message",
            type: "boolean",
          },
        },
        required: ["isCorrect"],
        additionalProperties: false
      },
      strict: true,
    }

    let newPrompt = chats[0].system_prompt ?? '';
    if (parsedAnswer && parsedAnswer?.actions && Array.isArray(parsedAnswer?.actions) && parsedAnswer?.actions.length > 0) {

      for (let i = 0; i < parsedAnswer.actions.length; i++) {
        const trigger = parsedAnswer.actions[i].trigger;
        const value = parsedAnswer.actions[i].value;
        if (trigger === 'knowledgeBase') {
          newPrompt += `Для ответа обязательно используй следующую информацию: ` + knowledgeBaseSum[value]?.answer
        } else if (trigger === 'productBase') {
          console.log("Вход во вподзапрос 2");
          const productBase = chats[0].product_base[0];
          const sepStr = productBase.google_sheets_link.split('/');
          const res = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${sepStr[5]}/values/${productBase.list_name}!A${(productBase.skip_rows ?? 0) + 1}:ZZ?key=${productBase.google_sheets_api_key}`);
          const products: string[][] = res.data.values;
          console.log(products)
          let founded = false;
          const que = value;
          if (productBase.method === 'ai') {
            const sortedProducts = await gptSearchService.findProducts(products, que, productBase.search_scope ?? 5);
            newPrompt += `Обязательно сообщи пользователю о результате поиска его товара. Результаты поиска: ` + sortedProducts.content;
          } else {
            const sortedProducts = await fuseService.findProducts(products, que, productBase.search_scope ?? 5);
            //console.log("sortedProducts.length - "+ sortedProducts.length)
            if (sortedProducts.length === 0) {
              newPrompt += `Обязательно сообщи пользователю, что товар ${que} по его запросу не найден.`;
            } else {
              newPrompt += `Для ответа используй информацию о самых подходящих товарах на запрос ${que}: `;
              //console.log(sortedProducts)
              for (let i = 0; i < sortedProducts.length; i++) {
                const sp = sortedProducts[i];
                newPrompt += `Название - ${sp.item[0]}, описание: - ${sp.item[1]} количество - ${sp.item[2]}, стоимость - ${sp.item[3]} \n`;
              }
              founded = true;
            }
            if (founded) {
              newPrompt += `Если в массиве есть подходящий товар, используй в ответе только его. Если подходящего нет, то предложи пользователю самый подхядий под описание пользователя товар.`;
            }
          }
        } else if (trigger === 'chatDataName') {
          const parsedName = checkChatData.name(value);
          if (parsedName.success) {
            const checkText = `Если "${parsedName.value}" корректное значение для имени пользователя, полученное из сообщения - верни "true". 
           Eсли "${parsedName.value}" - значение, которое не соответсует имени пользователя из сообщения или не является именем - верни "false"`;
            console.log(checkText)
            const _checkResult = await openaiService.getJsonAnswer(checkText, msg.text ?? '', checkSchema, { model: "gpt-4o-mini" });
            const checkResult = JSON.parse(_checkResult.content);
            console.log(checkResult)
            if (checkResult.isCorrect) {
              savedChatData.push({ trigger: trigger, value: parsedName.value })
              newPrompt += `Cообщи пользователю, что его имя записано.`;
            }
            await wabaRepository.setChatDataName(chats[0].chat_id, parsedName.value);
          }
        } else if (trigger === 'chatDataEmail') {
          const parsedEmail = checkChatData.email(value);
          if (parsedEmail.success) {
            const checkText = `Если "${parsedEmail.value}" корректный адрес электронной почты, полученный из сообщения - верни "true". 
          Eсли "${parsedEmail.value}" не соответсует email адресу из сообщения, не является email адресом или не соответствует регулярному выражению "/.+@.+\..+/i"  - верни "false"`;
            console.log(checkText)
            const _checkResult = await openaiService.getJsonAnswer(checkText, msg.text ?? '', checkSchema, { model: "gpt-4o-mini" });
            const checkResult = JSON.parse(_checkResult.content);
            console.log(checkResult)
            if (checkResult.isCorrect) {
              savedChatData.push({ trigger: trigger, value: value })
              newPrompt += `Cообщи пользователю, что его email записан.`;
              await wabaRepository.setChatDataEmail(chats[0].chat_id, parsedEmail.value);
            }
          }
        } else if (trigger === 'chatDataPhone') {
          const parsedPhone = checkChatData.phone(value);
          if (parsedPhone.success) {
            const checkText = `Если "${parsedPhone.value}" корректный номер телефона, полученный из сообщения - верни "true". 
          Eсли "${parsedPhone.value}" не соответсует номеру телефона из сообщения или не является номером телефона - верни "false"`;
            console.log(checkText)
            const _checkResult = await openaiService.getJsonAnswer(checkText, msg.text ?? '', checkSchema, { model: "gpt-4o-mini" });
            const checkResult = JSON.parse(_checkResult.content);
            console.log(checkResult)
            if (checkResult.isCorrect) {
              savedChatData.push({ trigger: trigger, value: parsedPhone.value })
              newPrompt += `Cообщи пользователю, что его телефон записан.`;
              await wabaRepository.setChatDataPhone(chats[0].chat_id, parsedPhone.value);
            }
          }
        }
      }
    }
    if (chats[0].is_knowledge_base_active) {
      const documents = await vectorStoreService.query(chats[0].project_id, msg.text, 3);
      console.log(documents)
      newPrompt += `Контекст: ` + documents.documents.join('\n');
    }
    answer = await selectedLLM.getAnswer(chats[0].gpt_model ?? "gpt-4o-mini", chats[0].messages, newPrompt, msg.text ?? '', { temperature: chats[0].temperature });
    tokens += answer.tokens;
    messages.push({ role: "assistant", content: answer.content })
    console.log(newPrompt)

    messages.map(async (item) => {
      console.log(msg)
      bot.sendMessage(msg.chat.id, item.content, { parse_mode: "Markdown" });
      await wabaRepository.createMessage(chats[0].chat_id, "assistant", item.content);
    });

    if (!chats[0].is_god) {
      if ((chats[0].tokens - tokens) < 0) {
        await projectRepository.setNotActive(chats[0].project_id, false)
      } else if ((chats[0].tokens - tokens) < 10000 && !chats[0].limit_alert) {
        console.log("Сообщение о лимитах отправлено", chats[0].tokens, tokens);
        const limitCount = await projectRepository.setLimitAlert(chats[0].project_id);
        const users = await projectRepository.getOwner(chats[0].project_id);
        if (limitCount === 1) {
          await mailService.sendLimitAlert(users[0].email)
        }
      }
    }
    if (chats[0].is_closed) {
      await wabaRepository.setOpened(chats[0].chat_id);
    }
    return true;
  }
  return {
    sendMessage,
    checkWebhook
  }
}
export default wabaUseCase;