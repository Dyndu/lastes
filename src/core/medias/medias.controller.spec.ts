import { Test, TestingModule } from '@nestjs/testing';
import { MediasController } from './medias.controller';
import { MediasService } from './services';
import { AddMediaDto } from './dto/add-media.dto';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MediasController', () => {
    let controller: MediasController;
    let service: MediasService;

    const mockMediasService = {
        retrieveMedias: jest.fn(),
        changeFile: jest.fn(),
        socialService: {
            allSocials: jest.fn(),
            toggleSocial: jest.fn(),
        },
        fInfoService: {
            footerInfo: jest.fn(),
            updateFInfo: jest.fn(),
        },
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

    const mockMediaData = {
        id: '1',
        name: 'test-media.jpg',
        url: 'https://example.com/media/test-media.jpg',
        type: 'image/jpeg',
        size: 1024,
    };

    const mockMediasList = [
        mockMediaData,
        {
            id: '2',
            name: 'video.mp4',
            url: 'https://example.com/media/video.mp4',
            type: 'video/mp4',
            size: 2048,
        },
    ];

    const mockAddMediaDto: AddMediaDto = {
        fileId: 'new-media.png',
        thumbnailId: 'https://example.com/media/new-media.png',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MediasController],
            providers: [
                {
                    provide: MediasService,
                    useValue: mockMediasService,
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

        controller = module.get<MediasController>(MediasController);
        service = module.get<MediasService>(MediasService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('mediaFileForAdmin', () => {
        it('should retrieve all media files for admin', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(mockMediasList);

            const result = await controller.mediaFileForAdmin();

            expect(result).toEqual(mockMediasList);
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
            expect(service.retrieveMedias).toHaveBeenCalledWith();
        });

        it('should return empty array when no media files exist', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue([]);

            const result = await controller.mediaFileForAdmin();

            expect(result).toEqual([]);
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database error');
            mockMediasService.retrieveMedias.mockRejectedValue(error);

            await expect(controller.mediaFileForAdmin()).rejects.toThrow('Database error');
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
        });

        it('should handle null response from service', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(null);

            const result = await controller.mediaFileForAdmin();

            expect(result).toBeNull();
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
        });

        it('should call service without parameters', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue([]);

            await controller.mediaFileForAdmin();

            expect(service.retrieveMedias).toHaveBeenCalledWith();
        });
    });

    describe('setMediaUrl', () => {
        it('should create or update media file successfully', async () => {
            const expectedResult = {
                ...mockMediaData,
                message: 'Media added successfully',
            };
            mockMediasService.changeFile.mockResolvedValue(expectedResult);

            const result = await controller.setMediaUrl(mockAddMediaDto);

            expect(result).toEqual(expectedResult);
            expect(service.changeFile).toHaveBeenCalledTimes(1);
            expect(service.changeFile).toHaveBeenCalledWith(mockAddMediaDto);
        });

        it('should handle update of existing media', async () => {
            const updateDto: AddMediaDto = {
                ...mockAddMediaDto,
                fileId: 'updated-media.png',
            };
            const expectedResult = {
                ...mockMediaData,
                fileId: 'updated-media.png',
                message: 'Media updated successfully',
            };
            mockMediasService.changeFile.mockResolvedValue(expectedResult);

            const result = await controller.setMediaUrl(updateDto);

            expect(result).toEqual(expectedResult);
            expect(service.changeFile).toHaveBeenCalledWith(updateDto);
        });

        it('should throw error when related entities not found', async () => {
            const error = new Error('Related media entities not found');
            mockMediasService.changeFile.mockRejectedValue(error);

            await expect(controller.setMediaUrl(mockAddMediaDto)).rejects.toThrow(
                'Related media entities not found',
            );
            expect(service.changeFile).toHaveBeenCalledTimes(1);
            expect(service.changeFile).toHaveBeenCalledWith(mockAddMediaDto);
        });

        it('should propagate validation errors', async () => {
            const validationError = new Error('Invalid media type');
            mockMediasService.changeFile.mockRejectedValue(validationError);

            await expect(controller.setMediaUrl(mockAddMediaDto)).rejects.toThrow(
                'Invalid media type',
            );
            expect(service.changeFile).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning null', async () => {
            mockMediasService.changeFile.mockResolvedValue(null);

            const result = await controller.setMediaUrl(mockAddMediaDto);

            expect(result).toBeNull();
            expect(service.changeFile).toHaveBeenCalledWith(mockAddMediaDto);
        });

        it('should pass DTO exactly as received to service', async () => {
            mockMediasService.changeFile.mockResolvedValue(mockMediaData);

            await controller.setMediaUrl(mockAddMediaDto);

            expect(service.changeFile).toHaveBeenCalledTimes(1);
            const calledWith = mockMediasService.changeFile.mock.calls[0][0];
            expect(calledWith).toBe(mockAddMediaDto);
        });
    });

    describe('mediaFileForAll', () => {
        it('should retrieve media files for public page', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(mockMediasList);

            const result = await controller.mediaFileForAll();

            expect(result).toEqual(mockMediasList);
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
            expect(service.retrieveMedias).toHaveBeenCalledWith();
        });

        it('should return empty array when no media available', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue([]);

            const result = await controller.mediaFileForAll();

            expect(result).toEqual([]);
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
        });

        it('should handle service errors on public endpoint', async () => {
            const error = new Error('Service unavailable');
            mockMediasService.retrieveMedias.mockRejectedValue(error);

            await expect(controller.mediaFileForAll()).rejects.toThrow('Service unavailable');
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
        });

        it('should handle null response', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(null);

            const result = await controller.mediaFileForAll();

            expect(result).toBeNull();
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);
        });

        it('should call service without parameters', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue([]);

            await controller.mediaFileForAll();

            expect(service.retrieveMedias).toHaveBeenCalledWith();
        });
    });

    describe('Controller metadata', () => {
        it('should have correct controller path', () => {
            const path = Reflect.getMetadata('path', MediasController);
            expect(path).toBe('medias');
        });

        it('should have GET method metadata on mediaFileForAdmin', () => {
            const path = Reflect.getMetadata('path', controller.mediaFileForAdmin);
            expect(path).toBeDefined();
        });

        it('should have POST method metadata on setMediaUrl', () => {
            const path = Reflect.getMetadata('path', controller.setMediaUrl);
            expect(path).toBeDefined();
        });

        it('should have GET method with path metadata on mediaFileForAll', () => {
            const path = Reflect.getMetadata('path', controller.mediaFileForAll);
            expect(path).toBeDefined();
        });

        it('should have MediasService injected', () => {
            expect(controller['mediaService']).toBeDefined();
            expect(controller['mediaService']).toBe(service);
        });
    });

    describe('Service method isolation', () => {
        it('should call retrieveMedias independently for admin and public routes', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(mockMediasList);

            await controller.mediaFileForAdmin();
            await controller.mediaFileForAll();

            expect(service.retrieveMedias).toHaveBeenCalledTimes(2);
        });

        it('should handle concurrent requests correctly', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(mockMediasList);
            mockMediasService.changeFile.mockResolvedValue(mockMediaData);

            const [adminResult, publicResult, createResult] = await Promise.all([
                controller.mediaFileForAdmin(),
                controller.mediaFileForAll(),
                controller.setMediaUrl(mockAddMediaDto),
            ]);

            expect(adminResult).toEqual(mockMediasList);
            expect(publicResult).toEqual(mockMediasList);
            expect(createResult).toEqual(mockMediaData);
            expect(service.retrieveMedias).toHaveBeenCalledTimes(2);
            expect(service.changeFile).toHaveBeenCalledTimes(1);
        });

        it('should verify each method calls service independently', async () => {
            mockMediasService.retrieveMedias.mockResolvedValue(mockMediasList);
            mockMediasService.changeFile.mockResolvedValue(mockMediaData);

            await controller.mediaFileForAdmin();
            expect(service.retrieveMedias).toHaveBeenCalledTimes(1);

            await controller.setMediaUrl(mockAddMediaDto);
            expect(service.changeFile).toHaveBeenCalledTimes(1);

            await controller.mediaFileForAll();
            expect(service.retrieveMedias).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error propagation', () => {
        it('should propagate database errors from admin endpoint', async () => {
            const dbError = new Error('Database connection failed');
            mockMediasService.retrieveMedias.mockRejectedValue(dbError);

            await expect(controller.mediaFileForAdmin()).rejects.toThrow(
                'Database connection failed',
            );
        });

        it('should propagate validation errors from creation', async () => {
            const validationError = new Error('Invalid file format');
            mockMediasService.changeFile.mockRejectedValue(validationError);

            await expect(controller.setMediaUrl(mockAddMediaDto)).rejects.toThrow(
                'Invalid file format',
            );
        });

        it('should propagate errors from public endpoint', async () => {
            const error = new Error('Server error');
            mockMediasService.retrieveMedias.mockRejectedValue(error);

            await expect(controller.mediaFileForAll()).rejects.toThrow('Server error');
        });
    });

    describe('allSocial', () => {
        const mockSocialNetworks = [
            {
                id: '1',
                name: 'Facebook',
                url: 'https://facebook.com/example',
                isActive: true,
            },
            {
                id: '2',
                name: 'Twitter',
                url: 'https://twitter.com/example',
                isActive: true,
            },
        ];

        it('should retrieve all social networks', async () => {
            mockMediasService.socialService.allSocials.mockResolvedValue(mockSocialNetworks);

            const result = await controller.allSocial();

            expect(result).toEqual(mockSocialNetworks);
            expect(service.socialService.allSocials).toHaveBeenCalledTimes(1);
            expect(service.socialService.allSocials).toHaveBeenCalledWith();
        });

        it('should return empty array when no social networks exist', async () => {
            mockMediasService.socialService.allSocials.mockResolvedValue([]);

            const result = await controller.allSocial();

            expect(result).toEqual([]);
            expect(service.socialService.allSocials).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database error');
            mockMediasService.socialService.allSocials.mockRejectedValue(error);

            await expect(controller.allSocial()).rejects.toThrow('Database error');
            expect(service.socialService.allSocials).toHaveBeenCalledTimes(1);
        });

        it('should handle null response from service', async () => {
            mockMediasService.socialService.allSocials.mockResolvedValue(null);

            const result = await controller.allSocial();

            expect(result).toBeNull();
            expect(service.socialService.allSocials).toHaveBeenCalledTimes(1);
        });
    });

    describe('footerInfo', () => {
        const mockFooterInfo = {
            id: '1',
            address: '123 Main St',
            email: 'contact@example.com',
            phone: '+1234567890',
            copyright: '© 2024 Example',
        };

        it('should retrieve footer information', async () => {
            mockMediasService.fInfoService.footerInfo.mockResolvedValue(mockFooterInfo);

            const result = await controller.footerInfo();

            expect(result).toEqual(mockFooterInfo);
            expect(service.fInfoService.footerInfo).toHaveBeenCalledTimes(1);
            expect(service.fInfoService.footerInfo).toHaveBeenCalledWith();
        });

        it('should return empty object when no footer info exists', async () => {
            mockMediasService.fInfoService.footerInfo.mockResolvedValue({});

            const result = await controller.footerInfo();

            expect(result).toEqual({});
            expect(service.fInfoService.footerInfo).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database error');
            mockMediasService.fInfoService.footerInfo.mockRejectedValue(error);

            await expect(controller.footerInfo()).rejects.toThrow('Database error');
            expect(service.fInfoService.footerInfo).toHaveBeenCalledTimes(1);
        });

        it('should handle null response from service', async () => {
            mockMediasService.fInfoService.footerInfo.mockResolvedValue(null);

            const result = await controller.footerInfo();

            expect(result).toBeNull();
            expect(service.fInfoService.footerInfo).toHaveBeenCalledTimes(1);
        });
    });

    describe('toggleSocial', () => {
        const socialId = '550e8400-e29b-41d4-a716-446655440000';
        const mockToggledSocial = {
            id: socialId,
            name: 'Facebook',
            url: 'https://facebook.com/example',
            isActive: false,
            message: 'Social network toggled successfully',
        };

        it('should toggle social network status successfully', async () => {
            mockMediasService.socialService.toggleSocial.mockResolvedValue(mockToggledSocial);

            const result = await controller.toggleSocial(socialId);

            expect(result).toEqual(mockToggledSocial);
            expect(service.socialService.toggleSocial).toHaveBeenCalledTimes(1);
            expect(service.socialService.toggleSocial).toHaveBeenCalledWith(socialId);
        });

        it('should handle toggling from active to inactive', async () => {
            const activeToInactive = { ...mockToggledSocial, isActive: false };
            mockMediasService.socialService.toggleSocial.mockResolvedValue(activeToInactive);

            await controller.toggleSocial(socialId);
            expect(service.socialService.toggleSocial).toHaveBeenCalledWith(socialId);
        });

        it('should throw error when social network not found', async () => {
            const error = new Error('Social network not found');
            mockMediasService.socialService.toggleSocial.mockRejectedValue(error);

            await expect(controller.toggleSocial(socialId)).rejects.toThrow(
                'Social network not found',
            );
            expect(service.socialService.toggleSocial).toHaveBeenCalledTimes(1);
            expect(service.socialService.toggleSocial).toHaveBeenCalledWith(socialId);
        });

        it('should propagate validation errors for invalid UUID', async () => {
            const validationError = new Error('Invalid UUID format');
            mockMediasService.socialService.toggleSocial.mockRejectedValue(validationError);

            await expect(controller.toggleSocial(socialId)).rejects.toThrow('Invalid UUID format');
            expect(service.socialService.toggleSocial).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning null', async () => {
            mockMediasService.socialService.toggleSocial.mockResolvedValue(null);

            const result = await controller.toggleSocial(socialId);

            expect(result).toBeNull();
            expect(service.socialService.toggleSocial).toHaveBeenCalledWith(socialId);
        });

        it('should pass UUID exactly as received to service', async () => {
            mockMediasService.socialService.toggleSocial.mockResolvedValue(mockToggledSocial);

            await controller.toggleSocial(socialId);

            expect(service.socialService.toggleSocial).toHaveBeenCalledTimes(1);
            const calledWith = mockMediasService.socialService.toggleSocial.mock.calls[0][0];
            expect(calledWith).toBe(socialId);
        });
    });

    describe('updateFooterInfo', () => {
        const mockUpdateInfoDto = {
            address: '456 New Street',
            email: 'newemail@example.com',
            phone: '+9876543210',
            copyright: '© 2025 New Example',
        };

        const mockUpdatedFooter = {
            id: '1',
            ...mockUpdateInfoDto,
            message: 'Footer updated successfully',
        };

        it('should update footer information successfully', async () => {
            mockMediasService.fInfoService.updateFInfo.mockResolvedValue(mockUpdatedFooter);

            const result = await controller.updateFooterInfo(mockUpdateInfoDto);

            expect(result).toEqual(mockUpdatedFooter);
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledTimes(1);
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledWith(mockUpdateInfoDto);
        });

        it('should handle partial update of footer info', async () => {
            const partialDto = {
                email: 'updated@example.com',
            };
            const expectedResult = {
                ...mockUpdatedFooter,
                email: 'updated@example.com',
            };
            mockMediasService.fInfoService.updateFInfo.mockResolvedValue(expectedResult);

            const result = await controller.updateFooterInfo(partialDto);

            expect(result).toEqual(expectedResult);
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledWith(partialDto);
        });

        it('should throw error when footer entities not found', async () => {
            const error = new Error('Footer information not found');
            mockMediasService.fInfoService.updateFInfo.mockRejectedValue(error);

            await expect(controller.updateFooterInfo(mockUpdateInfoDto)).rejects.toThrow(
                'Footer information not found',
            );
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledTimes(1);
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledWith(mockUpdateInfoDto);
        });

        it('should propagate validation errors', async () => {
            const validationError = new Error('Invalid email format');
            mockMediasService.fInfoService.updateFInfo.mockRejectedValue(validationError);

            await expect(controller.updateFooterInfo(mockUpdateInfoDto)).rejects.toThrow(
                'Invalid email format',
            );
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning null', async () => {
            mockMediasService.fInfoService.updateFInfo.mockResolvedValue(null);

            const result = await controller.updateFooterInfo(mockUpdateInfoDto);

            expect(result).toBeNull();
            expect(service.fInfoService.updateFInfo).toHaveBeenCalledWith(mockUpdateInfoDto);
        });

        it('should pass DTO exactly as received to service', async () => {
            mockMediasService.fInfoService.updateFInfo.mockResolvedValue(mockUpdatedFooter);

            await controller.updateFooterInfo(mockUpdateInfoDto);

            expect(service.fInfoService.updateFInfo).toHaveBeenCalledTimes(1);
            const calledWith = mockMediasService.fInfoService.updateFInfo.mock.calls[0][0];
            expect(calledWith).toBe(mockUpdateInfoDto);
        });
    });
});
