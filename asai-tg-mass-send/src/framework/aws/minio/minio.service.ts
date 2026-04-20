import * as Minio from 'minio';
import * as path from 'path';
import sharp from 'sharp';
import { tmpdir } from 'os';

export class MinioService {
  private minio: Minio.Client;

  constructor() {
    this.minio = new Minio.Client({
      endPoint: 'minio',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }

  async saveAvatar(buffer: Buffer, newFilename: string, repository: string):Promise<boolean>  {
    try {
      const image = sharp(buffer); 
      await image
        .resize({ width: 128, height: 128 })
        .toFormat('png', { mozjpeg: true })
        .toFile(path.resolve(tmpdir(), 'request_' + newFilename));
      const metaData = { 'Content-Type': 'image/png' };
      await this.minio.fPutObject(
        repository,
        newFilename + '.png',
        path.resolve(tmpdir(), 'request_' + newFilename),
        metaData,
      );
      return true;
    } catch (err) {
      console.log(err);
      throw 'Ошибка при сохранении изображения';
    }
  }
}
