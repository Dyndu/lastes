import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { RoleEntity } from './entities/role.entity';

describe('RolesService', () => {
    let service: RolesService;
    let repository: jest.Mocked<RolesRepository>;
    let logger: jest.Mocked<any>;
    let errorHandlerService: jest.Mocked<ErrorHandlerService>;
    let otherUtils: jest.Mocked<OtherUtils>;

    beforeEach(async () => {
        const mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const mockRepository = {
            findActiveOne: jest.fn(),
        };

        const mockErrorHandlerService = {
            notFound: jest.fn(),
        };

        const mockOtherUtils = {
            formatCriteria: jest.fn(),
        };

        const mockEnvConfigService = {
            sAdminRole: 'super_admin',
            adminRole: 'admin',
            userRole: 'user',
            supportRole: 'support',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: RolesRepository,
                    useValue: mockRepository,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: OtherUtils,
                    useValue: mockOtherUtils,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        service = module.get<RolesService>(RolesService);
        repository = module.get(RolesRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        errorHandlerService = module.get(ErrorHandlerService);
        otherUtils = module.get(OtherUtils);
        module.get(EnvConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('retrieveRoleByCriteria', () => {
        const mockCriteria = { label: 'admin' };
        const mockFormattedCriteria = 'label: admin';
        const mockRole: RoleEntity = {
            id: '1',
            label: 'admin',
            deleted: false,
        } as RoleEntity;

        beforeEach(() => {
            otherUtils.formatCriteria.mockReturnValue(mockFormattedCriteria);
        });

        it('should format and log the search criteria', async () => {
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(mockCriteria);

            expect(otherUtils.formatCriteria).toHaveBeenCalledWith(mockCriteria);
            expect(logger.info).toHaveBeenCalledWith(`Find a role by ${mockFormattedCriteria}`);
        });

        it('should call repository.findActiveOne with correct parameters', async () => {
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(mockCriteria);

            expect(repository.findActiveOne).toHaveBeenCalledWith(
                repository,
                mockCriteria,
                undefined,
            );
        });

        it('should call repository.findActiveOne with relations when provided', async () => {
            const relations = ['permissions', 'users'];
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(mockCriteria, relations);

            expect(repository.findActiveOne).toHaveBeenCalledWith(
                repository,
                mockCriteria,
                relations,
            );
        });

        it('should return the role when found', async () => {
            repository.findActiveOne.mockResolvedValue(mockRole);

            const result = await service.retrieveRoleByCriteria(mockCriteria);

            expect(result).toEqual(mockRole);
        });

        it('should throw not found error when role does not exist', async () => {
            repository.findActiveOne.mockResolvedValue(null);

            await service.retrieveRoleByCriteria(mockCriteria);

            expect(errorHandlerService.notFound).toHaveBeenCalledWith(
                `Data not found with ${mockFormattedCriteria}`,
                'Data not found',
            );
        });

        it('should not call errorHandlerService when role is found', async () => {
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(mockCriteria);

            expect(errorHandlerService.notFound).not.toHaveBeenCalled();
        });

        it('should handle complex criteria objects', async () => {
            const complexCriteria = {
                label: 'admin',
                deleted: false,
                id: '123',
            };
            const complexFormatted = 'label: admin, deleted: false, id: 123';
            otherUtils.formatCriteria.mockReturnValue(complexFormatted);
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(complexCriteria);

            expect(otherUtils.formatCriteria).toHaveBeenCalledWith(complexCriteria);
            expect(logger.info).toHaveBeenCalledWith(`Find a role by ${complexFormatted}`);
            expect(repository.findActiveOne).toHaveBeenCalledWith(
                repository,
                complexCriteria,
                undefined,
            );
        });

        it('should handle empty criteria object', async () => {
            const emptyCriteria = {};
            const emptyFormatted = '';
            otherUtils.formatCriteria.mockReturnValue(emptyFormatted);
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(emptyCriteria);

            expect(otherUtils.formatCriteria).toHaveBeenCalledWith(emptyCriteria);
            expect(repository.findActiveOne).toHaveBeenCalledWith(
                repository,
                emptyCriteria,
                undefined,
            );
        });

        it('should handle multiple relations', async () => {
            const relations = ['permissions', 'users', 'createdBy'];
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(mockCriteria, relations);

            expect(repository.findActiveOne).toHaveBeenCalledWith(
                repository,
                mockCriteria,
                relations,
            );
        });

        it('should return role with all properties', async () => {
            const fullRole: RoleEntity = {
                id: '1',
                label: 'admin',
                deleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as RoleEntity;

            repository.findActiveOne.mockResolvedValue(fullRole);

            const result = await service.retrieveRoleByCriteria(mockCriteria);

            expect(result).toEqual(fullRole);
            expect(result.id).toBe('1');
            expect(result.label).toBe('admin');
            expect(result.deleted).toBe(false);
        });

        it('should log with correct format for different criteria', async () => {
            const criteria1 = { id: '123' };
            const formatted1 = 'id: 123';
            otherUtils.formatCriteria.mockReturnValue(formatted1);
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(criteria1);

            expect(logger.info).toHaveBeenCalledWith(`Find a role by ${formatted1}`);

            jest.clearAllMocks();

            const criteria2 = { label: 'support' };
            const formatted2 = 'label: support';
            otherUtils.formatCriteria.mockReturnValue(formatted2);
            repository.findActiveOne.mockResolvedValue(mockRole);

            await service.retrieveRoleByCriteria(criteria2);

            expect(logger.info).toHaveBeenCalledWith(`Find a role by ${formatted2}`);
        });
    });

    describe('service initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should have all dependencies injected', () => {
            expect(service.logger).toBeDefined();
            expect(service['roleRepo']).toBeDefined();
            expect(service.envConfigService).toBeDefined();
            expect(service.otherUtils).toBeDefined();
            expect(service.errorHandlerService).toBeDefined();
        });

        it('should have access to environment config values', () => {
            expect(service.envConfigService.sAdminRole).toBe('super_admin');
            expect(service.envConfigService.adminRole).toBe('admin');
            expect(service.envConfigService.userRole).toBe('user');
            expect(service.envConfigService.supportRole).toBe('support');
        });
    });
});
