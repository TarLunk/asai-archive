import { IAwsService, IDatabaseService, IInternalService, IMassSendService } from ".";

export interface IDependency {
  DatabaseService: IDatabaseService;
  InternalService: IInternalService;
  AwsService: IAwsService;
  MassSendService: IMassSendService,

}