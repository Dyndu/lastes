import { Global, Module } from '@nestjs/common';
import { ErrorHandlerService } from './errorHandler.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
    imports: [LoggerModule],
    providers: [ErrorHandlerService],
    exports: [ErrorHandlerService],
})
export class ResponseModule {}
