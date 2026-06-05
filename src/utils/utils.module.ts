import { Global, Module } from '@nestjs/common';
import { EnvConfigService } from './services/config';
import { AuthUtils, ConfigUtils, FilesUtils, GlobalUtils, OtherUtils } from './services/tools';

@Global()
@Module({
    providers: [EnvConfigService, OtherUtils, ConfigUtils, FilesUtils, GlobalUtils, AuthUtils],
    exports: [EnvConfigService, OtherUtils, ConfigUtils, FilesUtils, GlobalUtils, AuthUtils],
})
export class UtilsModule {}
