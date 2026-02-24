import { IDatabaseService, IInternalService} from ".";

export interface IDependency {
  DatabaseService: IDatabaseService;
  botTokens: Map<any, any>;
  InternalService: IInternalService;
}