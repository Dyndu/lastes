import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EnvConfigService } from '../../utils/services/config';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: {
                        info: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                    },
                },
                {
                    provide: EnvConfigService,
                    useValue: {
                        cryptoSecret: '12345678901234567890123456789012',
                        cryptoIv: '1234567890123456',
                    },
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
