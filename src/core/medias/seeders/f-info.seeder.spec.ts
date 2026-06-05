import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FooterInfoRepository } from '../repositories';
import { FooterInfoEntity } from '../entities';
import { FInfoSeeder } from './f-info.seeder';

describe('FInfoSeeder', () => {
    let seeder: FInfoSeeder;
    let fInfoRepo: jest.Mocked<FooterInfoRepository>;
    let logger: any;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockFooterInfoRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FInfoSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: FooterInfoRepository,
                    useValue: mockFooterInfoRepository,
                },
            ],
        }).compile();

        seeder = module.get<FInfoSeeder>(FInfoSeeder);
        fInfoRepo = module.get(FooterInfoRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('seed', () => {
        it('should create footer information when none exists', async () => {
            fInfoRepo.findOne.mockResolvedValue(null);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding footer information');
            expect(fInfoRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(logger.info).toHaveBeenCalledWith('Creating footer information');
            expect(fInfoRepo.create).toHaveBeenCalledTimes(1);

            const createdEntity = fInfoRepo.create.mock.calls[0][0];
            expect(createdEntity).toBeInstanceOf(FooterInfoEntity);
            expect(createdEntity.email).toBe('softvodooz@gmail.com');
            expect(createdEntity.phoneNumber).toBe('+12343243423');

            expect(logger.info).toHaveBeenCalledWith('Footer information seed successfully ended');
        });

        it('should not create footer information when it already exists', async () => {
            const existingFooterInfo = {
                id: '1',
                email: 'existing@example.com',
                phoneNumber: '+11111111111',
                deleted: false,
            } as FooterInfoEntity;

            fInfoRepo.findOne.mockResolvedValue(existingFooterInfo);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding footer information');
            expect(fInfoRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(logger.info).toHaveBeenCalledWith('Footer information already exists');
            expect(fInfoRepo.create).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Footer information seed successfully ended');
        });

        it('should create footer information with correct default values', async () => {
            fInfoRepo.findOne.mockResolvedValue(null);

            await seeder.seed();

            const createdEntity = fInfoRepo.create.mock.calls[0][0];
            expect(createdEntity.email).toBe('softvodooz@gmail.com');
            expect(createdEntity.phoneNumber).toBe('+12343243423');
        });

        it('should log all steps correctly when creating new footer info', async () => {
            fInfoRepo.findOne.mockResolvedValue(null);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledTimes(3);
            expect(logger.info).toHaveBeenNthCalledWith(1, 'Seeding footer information');
            expect(logger.info).toHaveBeenNthCalledWith(2, 'Creating footer information');
            expect(logger.info).toHaveBeenNthCalledWith(
                3,
                'Footer information seed successfully ended',
            );
        });

        it('should log all steps correctly when footer info exists', async () => {
            const existingFooterInfo = {
                id: '1',
                email: 'test@test.com',
                phoneNumber: '+99999999999',
                deleted: false,
            } as FooterInfoEntity;

            fInfoRepo.findOne.mockResolvedValue(existingFooterInfo);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledTimes(3);
            expect(logger.info).toHaveBeenNthCalledWith(1, 'Seeding footer information');
            expect(logger.info).toHaveBeenNthCalledWith(2, 'Footer information already exists');
            expect(logger.info).toHaveBeenNthCalledWith(
                3,
                'Footer information seed successfully ended',
            );
        });
    });
});
