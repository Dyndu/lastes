import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SocialSeeder } from './social.seeder';
import { SocialRepository } from '../repositories';
import { SocialEntity } from '../entities';

describe('SocialSeeder', () => {
    let seeder: SocialSeeder;
    let socialRepository: jest.Mocked<SocialRepository>;
    let logger: any;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockSocialRepository = {
        find: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SocialSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: SocialRepository,
                    useValue: mockSocialRepository,
                },
            ],
        }).compile();

        seeder = module.get<SocialSeeder>(SocialSeeder);
        socialRepository = module.get(SocialRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('seed', () => {
        it('should create all socials when database is empty', async () => {
            socialRepository.find.mockResolvedValue([]);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding socials seed');
            expect(socialRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(logger.info).toHaveBeenCalledWith('Creating social: Facebook');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Whatsapp');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Instagram');
            expect(logger.info).toHaveBeenCalledWith('Creating social: X');
            expect(logger.info).toHaveBeenCalledWith('Creating social: LinkedIn');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Discord');
            expect(socialRepository.create).toHaveBeenCalledTimes(6);
            expect(logger.info).toHaveBeenCalledWith('Social seed successfully ended');
        });

        it('should not create socials that already exist', async () => {
            const existingSocials = [
                { id: '1', label: 'Facebook', deleted: false } as SocialEntity,
                { id: '2', label: 'Instagram', deleted: false } as SocialEntity,
                { id: '3', label: 'X', deleted: false } as SocialEntity,
            ];

            socialRepository.find.mockResolvedValue(existingSocials);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding socials seed');
            expect(socialRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Facebook');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Instagram');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: X');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Whatsapp');
            expect(logger.info).toHaveBeenCalledWith('Creating social: LinkedIn');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Discord');
            expect(socialRepository.create).toHaveBeenCalledTimes(3);
            expect(logger.info).toHaveBeenCalledWith('Social seed successfully ended');
        });

        it('should not create any social when all already exist', async () => {
            const existingSocials = [
                { id: '1', label: 'Facebook', deleted: false } as SocialEntity,
                { id: '2', label: 'Whatsapp', deleted: false } as SocialEntity,
                { id: '3', label: 'Instagram', deleted: false } as SocialEntity,
                { id: '4', label: 'X', deleted: false } as SocialEntity,
                { id: '5', label: 'LinkedIn', deleted: false } as SocialEntity,
                { id: '6', label: 'Discord', deleted: false } as SocialEntity,
            ];

            socialRepository.find.mockResolvedValue(existingSocials);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding socials seed');
            expect(socialRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Facebook');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Whatsapp');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Instagram');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: X');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: LinkedIn');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Discord');
            expect(socialRepository.create).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Social seed successfully ended');
        });

        it('should handle socials with leading/trailing spaces in database', async () => {
            const existingSocials = [
                {
                    id: '1',
                    label: '  Facebook  ',
                    deleted: false,
                } as SocialEntity,
                {
                    id: '2',
                    label: 'Instagram ',
                    deleted: false,
                } as SocialEntity,
            ];

            socialRepository.find.mockResolvedValue(existingSocials);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Social already exists: Facebook');
            expect(logger.info).toHaveBeenCalledWith('Social already exists: Instagram');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Whatsapp');
            expect(logger.info).toHaveBeenCalledWith('Creating social: X');
            expect(logger.info).toHaveBeenCalledWith('Creating social: LinkedIn');
            expect(logger.info).toHaveBeenCalledWith('Creating social: Discord');
            expect(socialRepository.create).toHaveBeenCalledTimes(4);
        });

        it('should create SocialEntity with correct label for each new social', async () => {
            socialRepository.find.mockResolvedValue([]);

            await seeder.seed();

            const createCalls = socialRepository.create.mock.calls;

            expect(createCalls[0][0]).toBeInstanceOf(SocialEntity);
            expect(createCalls[0][0].label).toBe('Facebook');

            expect(createCalls[1][0]).toBeInstanceOf(SocialEntity);
            expect(createCalls[1][0].label).toBe('Whatsapp');

            expect(createCalls[2][0]).toBeInstanceOf(SocialEntity);
            expect(createCalls[2][0].label).toBe('Instagram');

            expect(createCalls[3][0]).toBeInstanceOf(SocialEntity);
            expect(createCalls[3][0].label).toBe('X');

            expect(createCalls[4][0]).toBeInstanceOf(SocialEntity);
            expect(createCalls[4][0].label).toBe('LinkedIn');

            expect(createCalls[5][0]).toBeInstanceOf(SocialEntity);
            expect(createCalls[5][0].label).toBe('Discord');
        });
    });
});
