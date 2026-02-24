import PostgresqlDatabaseService from "@src/framework/database/postgresql/postgresql.service";
import GigachatService from "@src/framework/gigachat/gigachat.service";
import GPTSearchService from "@src/framework/gptSearch/gptSearch.service";
import NodemailerService from "@src/framework/nodemail/nodemail.service";
//import OpenAIService from "@src/framework/opanai/openai.service";
import ProxyGPTServise from "@src/framework/proxyGpt/proxyGpt.service";
import FuseService from "@src/framework/search/fuse.service";
import TelegramBot from "node-telegram-bot-api";
import ChromaService from "@src/framework/chroma/chroma.service";

const dependency = {
    DatabaseService: new PostgresqlDatabaseService(),
    OpenaiService: new ProxyGPTServise(),
    MailService: new NodemailerService(),
    FuseService: new FuseService(),
    GigachatService: new GigachatService(),
    GPTSearchService: new GPTSearchService(),
    botTokens: new Map<string, TelegramBot>(),
    VectorStoreService: new ChromaService(),
}

export default dependency;