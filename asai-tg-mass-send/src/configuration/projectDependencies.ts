import PostgresqlDatabaseService from "@src/framework/database/postgresql/postgresql.service";
import internalService from "@src/framework/internalService/internalService.service";
import { MinioService } from "@src/framework/aws/minio/minio.service";
import GramJsService from "@src/framework/massSend/gramjs/gramjs.service";

const dependency = {
    DatabaseService: new PostgresqlDatabaseService(),
    InternalService: new internalService(),
    AwsService: new MinioService(),
    MassSendService: new GramJsService(),
}

export default dependency;