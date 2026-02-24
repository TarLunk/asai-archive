export interface IMailService{
    sendLimitAlert(email: string):Promise<boolean>;
}