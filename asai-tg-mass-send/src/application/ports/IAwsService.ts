export interface IAwsService{
    saveAvatar(file: any, newFilename: string, repository: string):Promise<boolean>;
}