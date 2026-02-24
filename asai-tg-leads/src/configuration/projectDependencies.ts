import PostgresqlDatabaseService from "@src/framework/database/postgresql/postgresql.service";
import TelegramBot from "node-telegram-bot-api";
import internalService from "@src/framework/internalService/internalService.service";

const dependency = {
    DatabaseService: new PostgresqlDatabaseService(),
    botTokens: new Map<string, TelegramBot>(),
    InternalService: new internalService(),
}

export default dependency;