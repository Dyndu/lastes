import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PermissionRepository } from './permissions.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { PermissionEntity } from './entities/permission.entity';
import { In } from 'typeorm';

describe('PermissionsService', () => {
    let service: PermissionsService;
    let permRepository: jest.Mocked<PermissionRepository>;
    let logger: any;
    let errorHandler: jest.Mocked<ErrorHandlerService>;
    let otherUtils: jest.Mocked<OtherUtils>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockPermissionEntity = {
        id: '1',
        label: 'Create User',
        action: 'user:create',
        ui: 'users',
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionsService,
                {
                    provide: PermissionRepository,
                    useValue: {
                        findActiveMany: jest.fn(),
                        find: jest.fn(),
                    },
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        notFound: jest.fn(),
                    },
                },
                {
                    provide: OtherUtils,
                    useValue: {
                        formatCriteria: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PermissionsService>(PermissionsService);
        permRepository = module.get(PermissionRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        errorHandler = module.get(ErrorHandlerService);
        otherUtils = module.get(OtherUtils);

        jest.clearAllMocks();
    });

    describe('transformPermsGroupedByUi', () => {
        it('should transform permissions grouped by UI category', () => {
            const permissions: PermissionEntity[] = [
                {
                    ...mockPermissionEntity,
                    id: '1',
                    ui: 'users',
                    label: 'Create User',
                    action: 'user:create',
                },
                {
                    ...mockPermissionEntity,
                    id: '2',
                    ui: 'users',
                    label: 'Edit User',
                    action: 'user:edit',
                },
                {
                    ...mockPermissionEntity,
                    id: '3',
                    ui: 'roles',
                    label: 'Create Role',
                    action: 'role:create',
                },
            ];

            const result = service.transformPermsGroupedByUi(permissions);

            expect(result).toHaveLength(2);
            expect(result).toEqual(
                expect.arrayContaining([
                    {
                        ui: 'users',
                        perms: [
                            {
                                id: '1',
                                label: 'Create User',
                                action: 'user:create',
                            },
                            {
                                id: '2',
                                label: 'Edit User',
                                action: 'user:edit',
                            },
                        ],
                    },
                    {
                        ui: 'roles',
                        perms: [
                            {
                                id: '3',
                                label: 'Create Role',
                                action: 'role:create',
                            },
                        ],
                    },
                ]),
            );
        });

        it('should handle empty array', () => {
            const result = service.transformPermsGroupedByUi([]);
            expect(result).toEqual([]);
        });

        it('should handle single permission', () => {
            const result = service.transformPermsGroupedByUi([mockPermissionEntity]);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                ui: 'users',
                perms: [
                    {
                        id: '1',
                        label: 'Create User',
                        action: 'user:create',
                    },
                ],
            });
        });
    });

    describe('retrievePermsByCriteria', () => {
        const criteria = { id: '1' };
        const relations = ['role'];

        beforeEach(() => {
            otherUtils.formatCriteria.mockReturnValue('id=1');
        });

        it('should retrieve permissions successfully without In() operator', async () => {
            const mockPerms = [mockPermissionEntity];
            permRepository.findActiveMany.mockResolvedValue(mockPerms);

            const result = await service.retrievePermsByCriteria(criteria, relations);

            expect(logger.info).toHaveBeenCalledWith('Retrieving permissions by id=1');
            expect(permRepository.findActiveMany).toHaveBeenCalledWith(
                permRepository,
                criteria,
                relations,
            );
            expect(result).toEqual(mockPerms);
            expect(errorHandler.notFound).not.toHaveBeenCalled();
        });

        it('should retrieve permissions successfully with In() operator and matching size', async () => {
            const mockPerms = [mockPermissionEntity, { ...mockPermissionEntity, id: '2' }];
            const criteriaWithIn = { id: In(['1', '2']) };

            otherUtils.formatCriteria.mockReturnValue('id=In([1,2])');
            permRepository.findActiveMany.mockResolvedValue(mockPerms);

            const result = await service.retrievePermsByCriteria(criteriaWithIn, relations);

            expect(result).toEqual(mockPerms);
            expect(errorHandler.notFound).not.toHaveBeenCalled();
        });

        it('should throw error when In() operator size does not match results', async () => {
            const mockPerms = [mockPermissionEntity];
            const criteriaWithIn = { id: In(['1', '2']) };

            otherUtils.formatCriteria.mockReturnValue('id=In([1,2])');
            permRepository.findActiveMany.mockResolvedValue(mockPerms);

            await service.retrievePermsByCriteria(criteriaWithIn, relations);

            expect(errorHandler.notFound).toHaveBeenCalledWith(
                'Expected 2 permissions but found 1. Some permission IDs do not exist.',
                'Permissions not found',
            );
        });

        it('should work without relations parameter', async () => {
            const mockPerms = [mockPermissionEntity];
            permRepository.findActiveMany.mockResolvedValue(mockPerms);

            const result = await service.retrievePermsByCriteria(criteria);

            expect(permRepository.findActiveMany).toHaveBeenCalledWith(
                permRepository,
                criteria,
                undefined,
            );
            expect(result).toEqual(mockPerms);
        });

        it('should handle empty results without In() operator', async () => {
            permRepository.findActiveMany.mockResolvedValue([]);

            const result = await service.retrievePermsByCriteria(criteria);

            expect(result).toEqual([]);
            expect(errorHandler.notFound).not.toHaveBeenCalled();
        });
    });

    describe('allPermissions', () => {
        it('should return all non-deleted permissions grouped by UI', async () => {
            const mockPerms: PermissionEntity[] = [
                { ...mockPermissionEntity, id: '1', ui: 'users' },
                { ...mockPermissionEntity, id: '2', ui: 'users' },
                { ...mockPermissionEntity, id: '3', ui: 'roles' },
            ];
            permRepository.find.mockResolvedValue(mockPerms);

            const result = await service.allPermissions();

            expect(logger.info).toHaveBeenCalledWith('Retrieve all permissions');
            expect(permRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(result).toHaveLength(2);
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ ui: 'users' }),
                    expect.objectContaining({ ui: 'roles' }),
                ]),
            );
        });

        it('should return empty array when no permissions exist', async () => {
            permRepository.find.mockResolvedValue([]);

            const result = await service.allPermissions();

            expect(logger.info).toHaveBeenCalledWith('Retrieve all permissions');
            expect(result).toEqual([]);
        });

        it('should only retrieve non-deleted permissions', async () => {
            permRepository.find.mockResolvedValue([mockPermissionEntity]);

            await service.allPermissions();

            expect(permRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
        });
    });

    describe('Service initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should have all dependencies injected', () => {
            expect(service['logger']).toBeDefined();
            expect(service['errorHandler']).toBeDefined();
            expect(service['otherUtils']).toBeDefined();
            expect(service['permRepository']).toBeDefined();
        });
    });
});
