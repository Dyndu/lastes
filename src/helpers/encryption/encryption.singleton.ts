import { EncryptionService } from './encryption.service';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { EnvConfigService } from '../../utils/services/config';
import { ConfigUtils } from '../../utils/services/tools';

let instance: EncryptionService;

export function getEncryptionService(): EncryptionService {
    if (!instance) {
        const configService = new ConfigService();
        const configUtils = new ConfigUtils();
        const envConfigService = new EnvConfigService(configService, configUtils);
        const logger = console as unknown as Logger;
        instance = new EncryptionService(logger, envConfigService);
    }
    return instance;
}
