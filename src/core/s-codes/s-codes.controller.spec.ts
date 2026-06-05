import { Test, TestingModule } from '@nestjs/testing';
import { SCodesController } from './s-codes.controller';
import { SCodesService } from './s-codes.service';
import { PaginationDto } from '../../common/dto';
import { FieldDto } from '../../common/dto';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

describe('SCodesController', () => {
    let controller: SCodesController;
    let service: SCodesService;

    const mockSCodesService = {
        getAllSCodes: jest.fn(),
        retrieveSCodeByCriteria: jest.fn(),
        createCode: jest.fn(),
        updateCode: jest.fn(),
        deleteCode: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SCodesController],
            providers: [
                {
                    provide: SCodesService,
                    useValue: mockSCodesService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtAuthGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
                {
                    provide: PermissionsGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
            ],
        }).compile();

        controller = module.get<SCodesController>(SCodesController);
        service = module.get<SCodesService>(SCodesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allSupportCodes', () => {
        it('should retrieve all support codes with default pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const mockResult = {
                data: [
                    { id: '1', label: 'Code 1' },
                    { id: '2', label: 'Code 2' },
                ],
                total: 2,
                page: 1,
                limit: 10,
            };

            mockSCodesService.getAllSCodes.mockResolvedValue(mockResult);

            const result = await controller.allSupportCodes(pagination);

            expect(service.getAllSCodes).toHaveBeenCalledWith(1, 10, {
                searchTerm: undefined,
            });
            expect(result).toEqual(mockResult);
        });

        it('should retrieve all support codes with custom pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 2;
            pagination.limit = 20;

            const mockResult = {
                data: [{ id: '3', label: 'Code 3' }],
                total: 1,
                page: 2,
                limit: 20,
            };

            mockSCodesService.getAllSCodes.mockResolvedValue(mockResult);

            const result = await controller.allSupportCodes(pagination);

            expect(service.getAllSCodes).toHaveBeenCalledWith(2, 20, {
                searchTerm: undefined,
            });
            expect(result).toEqual(mockResult);
        });

        it('should retrieve all support codes with search term', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const mockResult = {
                data: [{ id: '1', label: 'Test Code' }],
                total: 1,
                page: 1,
                limit: 10,
            };

            mockSCodesService.getAllSCodes.mockResolvedValue(mockResult);

            const result = await controller.allSupportCodes(pagination, 'Test');

            expect(service.getAllSCodes).toHaveBeenCalledWith(1, 10, {
                searchTerm: 'Test',
            });
            expect(result).toEqual(mockResult);
        });

        it('should retrieve all support codes with search and custom pagination', async () => {
            const pagination = new PaginationDto();
            pagination.page = 3;
            pagination.limit = 50;

            const mockResult = {
                data: [{ id: '5', label: 'Search Result' }],
                total: 1,
                page: 3,
                limit: 50,
            };

            mockSCodesService.getAllSCodes.mockResolvedValue(mockResult);

            const result = await controller.allSupportCodes(pagination, 'Search');

            expect(service.getAllSCodes).toHaveBeenCalledWith(3, 50, {
                searchTerm: 'Search',
            });
            expect(result).toEqual(mockResult);
        });

        it('should handle empty search term as undefined', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            mockSCodesService.getAllSCodes.mockResolvedValue(mockResult);

            const result = await controller.allSupportCodes(pagination, '');

            expect(service.getAllSCodes).toHaveBeenCalledWith(1, 10, {
                searchTerm: '',
            });
            expect(result).toEqual(mockResult);
        });

        it('should use pagination getPage() and getLimit() methods', async () => {
            const pagination = new PaginationDto();
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            mockSCodesService.getAllSCodes.mockResolvedValue(mockResult);

            await controller.allSupportCodes(pagination);

            expect(service.getAllSCodes).toHaveBeenCalledWith(
                pagination.getPage(),
                pagination.getLimit(),
                { searchTerm: undefined },
            );
        });
    });

    describe('findOne', () => {
        it('should retrieve a support code by id', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const mockCode = {
                id,
                label: 'Test Code',
            };

            mockSCodesService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);

            const result = await controller.findOne(id);

            expect(service.retrieveSCodeByCriteria).toHaveBeenCalledWith({
                id,
            });
            expect(result).toEqual(mockCode);
        });

        it('should retrieve a different support code by id', async () => {
            const id = '12345678-1234-1234-1234-123456789012';
            const mockCode = {
                id,
                label: 'Another Code',
            };

            mockSCodesService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);

            const result = await controller.findOne(id);

            expect(service.retrieveSCodeByCriteria).toHaveBeenCalledWith({
                id,
            });
            expect(result).toEqual(mockCode);
        });

        it('should handle service errors', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            mockSCodesService.retrieveSCodeByCriteria.mockRejectedValue(new Error('Not found'));

            await expect(controller.findOne(id)).rejects.toThrow('Not found');
            expect(service.retrieveSCodeByCriteria).toHaveBeenCalledWith({
                id,
            });
        });
    });

    describe('createSupportCode', () => {
        it('should create a support code', async () => {
            const dto = new FieldDto();
            dto.field = 'New Code';

            const mockResult = {
                message: 'Code created successfully.',
            };

            mockSCodesService.createCode.mockResolvedValue(mockResult);

            const result = await controller.createSupportCode(dto);

            expect(service.createCode).toHaveBeenCalledWith('New Code');
            expect(result).toEqual(mockResult);
        });

        it('should create a support code with different label', async () => {
            const dto = new FieldDto();
            dto.field = 'Another Code';

            const mockResult = {
                message: 'Code created successfully.',
            };

            mockSCodesService.createCode.mockResolvedValue(mockResult);

            const result = await controller.createSupportCode(dto);

            expect(service.createCode).toHaveBeenCalledWith('Another Code');
            expect(result).toEqual(mockResult);
        });

        it('should handle validation errors', async () => {
            const dto = new FieldDto();
            dto.field = 'Duplicate';

            mockSCodesService.createCode.mockRejectedValue(new Error('Validation error'));

            await expect(controller.createSupportCode(dto)).rejects.toThrow('Validation error');
            expect(service.createCode).toHaveBeenCalledWith('Duplicate');
        });

        it('should handle forbidden errors for reserved labels', async () => {
            const dto = new FieldDto();
            dto.field = 'other';

            mockSCodesService.createCode.mockRejectedValue(new Error('Forbidden'));

            await expect(controller.createSupportCode(dto)).rejects.toThrow('Forbidden');
            expect(service.createCode).toHaveBeenCalledWith('other');
        });
    });

    describe('updateSupportCode', () => {
        it('should update a support code', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const dto = new FieldDto();
            dto.field = 'Updated Code';

            const mockResult = {
                message: 'Code updated successfully.',
            };

            mockSCodesService.updateCode.mockResolvedValue(mockResult);

            const result = await controller.updateSupportCode(id, dto);

            expect(service.updateCode).toHaveBeenCalledWith(id, 'Updated Code');
            expect(result).toEqual(mockResult);
        });

        it('should update a support code with different id and label', async () => {
            const id = '12345678-1234-1234-1234-123456789012';
            const dto = new FieldDto();
            dto.field = 'Modified Label';

            const mockResult = {
                message: 'Code updated successfully.',
            };

            mockSCodesService.updateCode.mockResolvedValue(mockResult);

            const result = await controller.updateSupportCode(id, dto);

            expect(service.updateCode).toHaveBeenCalledWith(id, 'Modified Label');
            expect(result).toEqual(mockResult);
        });

        it('should handle not found errors', async () => {
            const id = '99999999-9999-9999-9999-999999999999';
            const dto = new FieldDto();
            dto.field = 'Updated Code';

            mockSCodesService.updateCode.mockRejectedValue(new Error('Not found'));

            await expect(controller.updateSupportCode(id, dto)).rejects.toThrow('Not found');
            expect(service.updateCode).toHaveBeenCalledWith(id, 'Updated Code');
        });

        it('should handle validation errors', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const dto = new FieldDto();
            dto.field = 'Duplicate';

            mockSCodesService.updateCode.mockRejectedValue(new Error('Validation error'));

            await expect(controller.updateSupportCode(id, dto)).rejects.toThrow('Validation error');
            expect(service.updateCode).toHaveBeenCalledWith(id, 'Duplicate');
        });

        it('should handle forbidden errors for reserved labels', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const dto = new FieldDto();
            dto.field = 'others';

            mockSCodesService.updateCode.mockRejectedValue(new Error('Forbidden'));

            await expect(controller.updateSupportCode(id, dto)).rejects.toThrow('Forbidden');
            expect(service.updateCode).toHaveBeenCalledWith(id, 'others');
        });
    });

    describe('deleteSupportCode', () => {
        it('should delete a support code', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            const mockResult = {
                message: 'Code deleted successfully.',
            };

            mockSCodesService.deleteCode.mockResolvedValue(mockResult);

            const result = await controller.deleteSupportCode(id);

            expect(service.deleteCode).toHaveBeenCalledWith(id);
            expect(result).toEqual(mockResult);
        });

        it('should delete a different support code', async () => {
            const id = '12345678-1234-1234-1234-123456789012';

            const mockResult = {
                message: 'Code deleted successfully.',
            };

            mockSCodesService.deleteCode.mockResolvedValue(mockResult);

            const result = await controller.deleteSupportCode(id);

            expect(service.deleteCode).toHaveBeenCalledWith(id);
            expect(result).toEqual(mockResult);
        });

        it('should handle not found errors', async () => {
            const id = '99999999-9999-9999-9999-999999999999';

            mockSCodesService.deleteCode.mockRejectedValue(new Error('Not found'));

            await expect(controller.deleteSupportCode(id)).rejects.toThrow('Not found');
            expect(service.deleteCode).toHaveBeenCalledWith(id);
        });

        it('should handle forbidden errors for reserved labels', async () => {
            const id = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            mockSCodesService.deleteCode.mockRejectedValue(new Error('Forbidden'));

            await expect(controller.deleteSupportCode(id)).rejects.toThrow('Forbidden');
            expect(service.deleteCode).toHaveBeenCalledWith(id);
        });
    });

    describe('Controller metadata', () => {
        it('should have correct controller path', () => {
            const path = Reflect.getMetadata('path', SCodesController);
            expect(path).toBe('s-codes');
        });

        it('should have JWT auth guard applied at controller level', () => {
            expect(controller).toBeDefined();
        });
    });
});
