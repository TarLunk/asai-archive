import { IDatabaseService, IFuseService, IGigachatService, IGPTSearchService, IMailService, IOpenaiService, IVectorStoreService } from ".";

export interface IDependency {
  DatabaseService: IDatabaseService;
  OpenaiService: IOpenaiService;
  MailService: IMailService;
  FuseService: IFuseService;
  GigachatService: IGigachatService;
  GPTSearchService: IGPTSearchService;
  VectorStoreService: IVectorStoreService;
}