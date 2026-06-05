import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ABuilderService } from './a-builder.service';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { PDetailsService } from './p-details.service';
import { UnitsService } from './units.service';
import { ADetailsService } from './a-details.service';
import { AdItemizedService } from './ad-itemized.service';
import { RepairsService } from './repairs.service';
import { ERepairsService } from './e-repairs.service';
import { IRepairsService } from './i-repairs.service';
import { ORepairsService } from './o-repairs.service';
import { SaleService } from './sale.service';
import { FExpensesService } from './f-expenses.service';
import { TransformABuilderService } from './transform-aBuilder.service';
import {
    ABuilderRepository,
    HCoastItemizedRepository,
    HCoastRepository,
    HDurationRepository,
    RDurationRepository,
    RefinanceItemRepository,
    RefinanceRepository,
    PDetailsRepository,
    UnitsRepository,
    ADetailsRepository,
    AdItemizedRepository,
    RepairsRepository,
    IRepairsRepository,
    ERepairsRepository,
    ORepairsRepository,
    FExpensesRepository,
    SaleRepository,
    CCoastRepository,
    BrRefinanceRepository,
} from '../repositories';
import { ABuilderEntity } from '../entities';
import { RAnalysisEntity } from '../../r-analysis/entities/r-analysis.entity';
import { FFlipEntity } from '../../fix-flip/entity/f-flip.entity';
import { CFinancingEntity } from '../../creative-financing/entities/c-financing.entity';
import { HCoastService } from './h-coast.service';
import { HCoastItemizedService } from './h-coast-itemized.service';
import { HDurationService } from './h-duration.service';
import { RefinanceService } from './refinance.service';
import { RefinanceItemService } from './refinance-item.service';
import { RDurationService } from './r-duration.service';
import { WholesaleEntity } from '../../wholesale/entities/wholesale.entity';
import { IStrategyEntity } from '../../i-strategy/entities/i-strategy.entity';
import { CCoastService } from './c-coast.service';
import { BrRefinanceService } from './br-refinance.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ABuilderService', () => {
    let service: ABuilderService;
    let aBuilderRepository: jest.Mocked<ABuilderRepository>;

    const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const mockService = () => ({ jest: jest.fn() });
    const mockRepo = () => ({ create: jest.fn(), save: jest.fn(), findOne: jest.fn() });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ABuilderService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PDetailsService, useValue: mockService() },
                { provide: UnitsService, useValue: mockService() },
                { provide: ADetailsService, useValue: mockService() },
                { provide: AdItemizedService, useValue: mockService() },
                { provide: RepairsService, useValue: mockService() },
                { provide: ERepairsService, useValue: mockService() },
                { provide: IRepairsService, useValue: mockService() },
                { provide: ORepairsService, useValue: mockService() },
                { provide: SaleService, useValue: mockService() },
                { provide: HCoastService, useValue: mockService() },
                { provide: HCoastItemizedService, useValue: mockService() },
                { provide: FExpensesService, useValue: mockService() },
                { provide: CCoastService, useValue: mockService() },
                { provide: BrRefinanceService, useValue: mockService() },
                { provide: TransformABuilderService, useValue: mockService() },
                { provide: ErrorHandlerService, useValue: mockService() },
                { provide: OtherUtils, useValue: mockService() },
                { provide: ABuilderRepository, useValue: mockRepo() },
                { provide: PDetailsRepository, useValue: mockRepo() },
                { provide: UnitsRepository, useValue: mockRepo() },
                { provide: ADetailsRepository, useValue: mockRepo() },
                { provide: AdItemizedRepository, useValue: mockRepo() },
                { provide: RepairsRepository, useValue: mockRepo() },
                { provide: ERepairsRepository, useValue: mockRepo() },
                { provide: IRepairsRepository, useValue: mockRepo() },
                { provide: ORepairsRepository, useValue: mockRepo() },
                { provide: FExpensesRepository, useValue: mockRepo() },
                { provide: SaleRepository, useValue: mockRepo() },
                { provide: HCoastRepository, useValue: mockRepo() },
                { provide: HCoastItemizedRepository, useValue: mockRepo() },
                { provide: HDurationService, useValue: mockService() },
                { provide: RefinanceService, useValue: mockService() },
                { provide: RefinanceItemService, useValue: mockService() },
                { provide: RDurationService, useValue: mockService() },
                { provide: HDurationRepository, useValue: mockRepo() },
                { provide: RefinanceRepository, useValue: mockRepo() },
                { provide: RefinanceItemRepository, useValue: mockRepo() },
                { provide: RDurationRepository, useValue: mockRepo() },
                { provide: SaleRepository, useValue: mockRepo() },
                { provide: CCoastRepository, useValue: mockRepo() },
                { provide: BrRefinanceRepository, useValue: mockRepo() },
            ],
        }).compile();

        service = module.get<ABuilderService>(ABuilderService);
        aBuilderRepository = module.get(ABuilderRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildABuilderEntity', () => {
        it('should return an ABuilderEntity with no optional fields', () => {
            const result = service.buildABuilderEntity({});

            expect(result).toBeInstanceOf(ABuilderEntity);
        });

        it('should assign rAnalysis when provided', () => {
            const rAnalysis = new RAnalysisEntity();
            const result = service.buildABuilderEntity({ rAnalysis });

            expect(result).toBeInstanceOf(ABuilderEntity);
            expect(result.rAnalysis).toBe(rAnalysis);
        });

        it('should assign fFlip when provided', () => {
            const fFlip = new FFlipEntity();
            const result = service.buildABuilderEntity({ fFlip });

            expect(result).toBeInstanceOf(ABuilderEntity);
            expect(result.fFlip).toBe(fFlip);
        });

        it('should assign cFinancing when provided', () => {
            const cFinancing = new CFinancingEntity();
            const result = service.buildABuilderEntity({ cFinancing });

            expect(result).toBeInstanceOf(ABuilderEntity);
            expect(result.cFinancing).toBe(cFinancing);
        });

        it('should assign both rAnalysis and fFlip when provided', () => {
            const rAnalysis = new RAnalysisEntity();
            const fFlip = new FFlipEntity();
            const cFinancing = new CFinancingEntity();
            const result = service.buildABuilderEntity({ rAnalysis, fFlip, cFinancing });

            expect(result.rAnalysis).toBe(rAnalysis);
            expect(result.fFlip).toBe(fFlip);
            expect(result.cFinancing).toBe(cFinancing);
        });

        it('should assign wholesale when provided', () => {
            const wholesale = new WholesaleEntity();
            const result = service.buildABuilderEntity({ wholesale });

            expect(result).toBeInstanceOf(ABuilderEntity);
            expect(result.wholesale).toBe(wholesale);
        });

        it('should assign iStrategy when provided', () => {
            const iStrategy = new IStrategyEntity();
            const result = service.buildABuilderEntity({ iStrategy });

            expect(result).toBeInstanceOf(ABuilderEntity);
            expect(result.iStrategy).toBe(iStrategy);
        });

        it('should leave all optional fields undefined when empty object provided', () => {
            const result = service.buildABuilderEntity({});

            expect(result.rAnalysis).toBeUndefined();
            expect(result.fFlip).toBeUndefined();
            expect(result.cFinancing).toBeUndefined();
            expect(result.wholesale).toBeUndefined();
            expect(result.iStrategy).toBeUndefined();
        });
    });

    describe('createABuilder', () => {
        it('should create and return an ABuilderEntity with no arguments', async () => {
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder();

            expect(aBuilderRepository.create).toHaveBeenCalledWith(expect.any(ABuilderEntity));
            expect(result).toBe(savedEntity);
        });

        it('should create an entities with rAnalysis when provided', async () => {
            const rAnalysis = new RAnalysisEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(rAnalysis);

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ rAnalysis }),
            );
            expect(result).toBe(savedEntity);
        });

        it('should create an entities with fFlip when provided', async () => {
            const fFlip = new FFlipEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(undefined, fFlip);

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ fFlip }),
            );
            expect(result).toBe(savedEntity);
        });

        it('should create an entities with cFinancing when provided', async () => {
            const cFinancing = new CFinancingEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(undefined, undefined, cFinancing);

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ cFinancing }),
            );
            expect(result).toBe(savedEntity);
        });

        it('should create an entities with both rAnalysis and fFlip when provided', async () => {
            const rAnalysis = new RAnalysisEntity();
            const fFlip = new FFlipEntity();
            const cFinancing = new CFinancingEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(rAnalysis, fFlip, cFinancing);

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ rAnalysis, fFlip, cFinancing }),
            );
            expect(result).toBe(savedEntity);
        });

        it('should create an entity with wholesale when provided', async () => {
            const wholesale = new WholesaleEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(undefined, undefined, undefined, wholesale);

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ wholesale }),
            );
            expect(result).toBe(savedEntity);
        });

        it('should create an entity with iStrategy when provided', async () => {
            const iStrategy = new IStrategyEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(
                undefined,
                undefined,
                undefined,
                undefined,
                iStrategy,
            );

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ iStrategy }),
            );
            expect(result).toBe(savedEntity);
        });

        it('should create an entity with all optional arguments provided', async () => {
            const rAnalysis = new RAnalysisEntity();
            const fFlip = new FFlipEntity();
            const cFinancing = new CFinancingEntity();
            const wholesale = new WholesaleEntity();
            const iStrategy = new IStrategyEntity();
            const savedEntity = new ABuilderEntity();
            aBuilderRepository.create.mockResolvedValue(savedEntity);

            const result = await service.createABuilder(
                rAnalysis,
                fFlip,
                cFinancing,
                wholesale,
                iStrategy,
            );

            expect(aBuilderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ rAnalysis, fFlip, cFinancing, wholesale, iStrategy }),
            );
            expect(result).toBe(savedEntity);
        });
    });

    describe('retrieveABuilderByCriteria', () => {
        const mockOtherUtils = { formatCriteria: jest.fn().mockReturnValue('formatted-criteria') };
        const mockErrorHandler = { notFound: jest.fn() };
        const mockABuilderRepo = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findActiveOne: jest.fn(),
        };

        beforeEach(() => {
            Object.assign(service['otherUtils'], mockOtherUtils);
            Object.assign(service['errorHandler'], mockErrorHandler);
            Object.assign(service['aBuilderRepository'], mockABuilderRepo);
        });

        afterEach(() => jest.clearAllMocks());

        it('should return the entity when found', async () => {
            const entity = new ABuilderEntity();
            mockABuilderRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveABuilderByCriteria({ id: 'ab-1' }, ['relation']);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith({ id: 'ab-1' });
            expect(mockABuilderRepo.findActiveOne).toHaveBeenCalledWith(
                service['aBuilderRepository'],
                { id: 'ab-1' },
                ['relation'],
            );
            expect(result).toBe(entity);
        });

        it('should call errorHandler.notFound when entity is not found', async () => {
            mockABuilderRepo.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {
                throw new Error('Not Found');
            });

            await expect(service.retrieveABuilderByCriteria({ id: 'missing' })).rejects.toThrow(
                'Not Found',
            );

            expect(mockErrorHandler.notFound).toHaveBeenCalled();
        });

        it('should work without the optional relation parameter', async () => {
            const entity = new ABuilderEntity();
            mockABuilderRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveABuilderByCriteria({ id: 'ab-1' });

            expect(mockABuilderRepo.findActiveOne).toHaveBeenCalledWith(
                service['aBuilderRepository'],
                { id: 'ab-1' },
                undefined,
            );
            expect(result).toBe(entity);
        });
    });
});
