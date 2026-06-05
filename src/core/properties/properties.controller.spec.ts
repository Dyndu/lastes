import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './services';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import { CurrentUserInterface } from '../../interface';
import { PaginationDto } from '../../common/dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PropertiesController', () => {
    let controller: PropertiesController;
    let propertiesService: {
        getUserProperties: jest.Mock;
        getPropertyDetails: jest.Mock;
        rentCastService: { getProperty: jest.Mock };
    };

    const mockUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
        sessionId: 'session-123',
        permissions: {},
    };

    const mockPaginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        getPage: jest.fn().mockReturnValue(1),
        getLimit: jest.fn().mockReturnValue(10),
    } as any;

    const mockProperty = {
        id: 'prop-123',
        label: '3465 West End Avenue, Long Beach Island',
        description: 'A nice property',
        createdBy: { id: 'user-123' },
    } as any;

    const mockPropertiesList = {
        data: [mockProperty],
        total: 1,
        page: 1,
        limit: 10,
    };

    beforeEach(async () => {
        propertiesService = {
            getUserProperties: jest.fn(),
            getPropertyDetails: jest.fn(),
            rentCastService: {
                getProperty: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PropertiesController],
            providers: [
                {
                    provide: PropertiesService,
                    useValue: propertiesService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .overrideGuard(PermissionsGuard)
            .useValue({ canActivate: jest.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<PropertiesController>(PropertiesController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('userProperties', () => {
        it('should retrieve user properties without search term', async () => {
            propertiesService.getUserProperties.mockResolvedValue(mockPropertiesList);

            const result = await controller.userProperties(mockUser, mockPaginationDto);

            expect(propertiesService.getUserProperties).toHaveBeenCalledWith(
                'user-123',
                1,
                10,
                undefined,
            );
            expect(result).toEqual(mockPropertiesList);
        });

        it('should retrieve user properties with a search term', async () => {
            propertiesService.getUserProperties.mockResolvedValue(mockPropertiesList);

            const result = await controller.userProperties(mockUser, mockPaginationDto, 'beach');

            expect(propertiesService.getUserProperties).toHaveBeenCalledWith(
                'user-123',
                1,
                10,
                'beach',
            );
            expect(result).toEqual(mockPropertiesList);
        });

        it('should use pagination values returned by getPage() and getLimit()', async () => {
            const customPagination: PaginationDto = {
                page: 3,
                limit: 25,
                getPage: jest.fn().mockReturnValue(3),
                getLimit: jest.fn().mockReturnValue(25),
            } as any;

            propertiesService.getUserProperties.mockResolvedValue(mockPropertiesList);

            await controller.userProperties(mockUser, customPagination);

            expect(customPagination.getPage).toHaveBeenCalled();
            expect(customPagination.getLimit).toHaveBeenCalled();
            expect(propertiesService.getUserProperties).toHaveBeenCalledWith(
                'user-123',
                3,
                25,
                undefined,
            );
        });

        it('should pass user.id (not the full user object) to the service', async () => {
            propertiesService.getUserProperties.mockResolvedValue(mockPropertiesList);

            await controller.userProperties(mockUser, mockPaginationDto);

            expect(propertiesService.getUserProperties).toHaveBeenCalledWith(
                'user-123',
                expect.any(Number),
                expect.any(Number),
                undefined,
            );
        });

        it('should handle an empty result set', async () => {
            const emptyResult = { data: [], total: 0, page: 1, limit: 10 };
            propertiesService.getUserProperties.mockResolvedValue(emptyResult);

            const result = await controller.userProperties(mockUser, mockPaginationDto);

            expect(result).toEqual(emptyResult);
        });

        it('should propagate service errors', async () => {
            propertiesService.getUserProperties.mockRejectedValue(new Error('DB error'));

            await expect(controller.userProperties(mockUser, mockPaginationDto)).rejects.toThrow(
                'DB error',
            );
        });
    });

    describe('detailsApp', () => {
        it('should call getPropertyDetails with user and id and return result', async () => {
            const mockResult = {
                address: '123 Main St',
                propertyType: 'Single Family',
                squareFootage: 1200,
                yearBuilt: 2005,
            };
            propertiesService.getPropertyDetails = jest.fn().mockResolvedValue(mockResult);

            const result = await controller.detailsApp(mockUser, 'prop-123');

            expect(propertiesService.getPropertyDetails).toHaveBeenCalledWith(mockUser, 'prop-123');
            expect(result).toEqual(mockResult);
        });

        it('should pass the exact user object and id to the service', async () => {
            propertiesService.getPropertyDetails = jest.fn().mockResolvedValue({});

            await controller.detailsApp(mockUser, 'some-uuid');

            expect(propertiesService.getPropertyDetails).toHaveBeenCalledWith(
                mockUser,
                'some-uuid',
            );
        });

        it('should propagate errors from getPropertyDetails', async () => {
            propertiesService.getPropertyDetails = jest
                .fn()
                .mockRejectedValue(new Error('Property not found'));

            await expect(controller.detailsApp(mockUser, 'prop-123')).rejects.toThrow(
                'Property not found',
            );
        });
    });

    describe('details', () => {
        it('should return property details for a valid id', async () => {
            propertiesService.rentCastService.getProperty.mockResolvedValue(mockProperty);

            const result = await controller.details('prop-123');

            expect(propertiesService.rentCastService.getProperty).toHaveBeenCalledWith('prop-123');
            expect(result).toEqual(mockProperty);
        });

        it('should pass the exact id string to rentCastService.getProperty', async () => {
            propertiesService.rentCastService.getProperty.mockResolvedValue(mockProperty);

            await controller.details('some-other-uuid');

            expect(propertiesService.rentCastService.getProperty).toHaveBeenCalledWith(
                'some-other-uuid',
            );
        });

        it('should propagate errors from rentCastService.getProperty', async () => {
            propertiesService.rentCastService.getProperty.mockRejectedValue(
                new Error('Property not found'),
            );

            await expect(controller.details('prop-123')).rejects.toThrow('Property not found');
        });
    });
});
