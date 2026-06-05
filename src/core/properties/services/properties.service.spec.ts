import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PropertiesService } from './properties.service';
import { PropertiesRepository } from '../properties.repository';
import { ErrorHandlerService } from '../../../common/response';
import { CacheService } from '../../../helpers/cache/cache.service';
import { PrePropertiesService } from './pre-properties.service';
import { UsersService } from '../../users/services';
import { OtherUtils } from '../../../utils/services/tools';
import { RentalService } from '../../../helpers/rentalcastcash/rental.service';
import { TransformPropertyEntityService } from './transform-property-entity.service';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeProperty = (overrides: Partial<PropertyEntity> = {}): PropertyEntity =>
    ({
        id: 'prop-1',
        formattedAddress: '123 Main St, Springfield, IL 62701',
        createdBy: { id: 'user-1' } as UserEntity,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
        ...overrides,
    }) as PropertyEntity;

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({
        id: 'user-1',
        ...overrides,
    }) as UserEntity;

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

describe('PropertiesService', () => {
    let service: PropertiesService;

    let propertiesRepo: jest.Mocked<Pick<PropertiesRepository, 'findOne' | 'create'>>;
    let cacheService: jest.Mocked<
        Pick<CacheService, 'generateRedisKey' | 'retrieveGenericPaginated'>
    >;
    let prePropertiesService: jest.Mocked<
        Pick<
            PrePropertiesService,
            'retrieveUserProperties' | 'buildPropertyEntity' | 'invalidatePCache'
        >
    >;
    let rentCastService: jest.Mocked<Pick<RentalService, 'getProperty'>>;
    let transformPService: jest.Mocked<
        Pick<TransformPropertyEntityService, 'createPropertyEntity' | 'transformProperties'>
    >;

    let usersService: { preUserService: { retrieveUserByCriteria: jest.Mock } };

    beforeEach(async () => {
        propertiesRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
        };

        cacheService = {
            generateRedisKey: jest.fn().mockReturnValue('cache-key'),
            retrieveGenericPaginated: jest.fn(),
        };

        prePropertiesService = {
            retrieveUserProperties: jest.fn(),
            buildPropertyEntity: jest.fn().mockReturnValue({} as PropertyEntity),
            invalidatePCache: jest.fn().mockResolvedValue(undefined),
        };

        rentCastService = {
            getProperty: jest.fn(),
        };

        transformPService = {
            createPropertyEntity: jest.fn().mockReturnValue(['createdBy']),
            transformProperties: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PropertiesService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PropertiesRepository, useValue: propertiesRepo },
                { provide: ErrorHandlerService, useValue: {} },
                { provide: CacheService, useValue: cacheService },
                { provide: PrePropertiesService, useValue: prePropertiesService },
                {
                    provide: UsersService,
                    useValue: {
                        preUserService: {
                            retrieveUserByCriteria: jest.fn(),
                        },
                    },
                },
                { provide: OtherUtils, useValue: {} },
                { provide: RentalService, useValue: rentCastService },
                { provide: TransformPropertyEntityService, useValue: transformPService },
            ],
        }).compile();

        service = module.get<PropertiesService>(PropertiesService);
        usersService = module.get(UsersService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('getUserProperties', () => {
        const userId = 'user-1';
        const paginatedResult = { data: [], total: 0, page: 1, limit: 10 };

        beforeEach(() => {
            cacheService.retrieveGenericPaginated.mockResolvedValue(paginatedResult);
        });

        it('should log the retrieval action', async () => {
            await service.getUserProperties(userId, 1, 10);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieving properties for user ${userId}`,
            );
        });

        it('should generate a redis key without search term', async () => {
            await service.getUserProperties(userId, 1, 10);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith(`properties-${userId}`, {});
        });

        it('should generate a redis key with lowercased search term when provided', async () => {
            await service.getUserProperties(userId, 1, 10, 'MySearch');

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith(`properties-${userId}`, {
                search: 'mysearch',
            });
        });

        it('should call retrieveGenericPaginated with correct static arguments', async () => {
            await service.getUserProperties(userId, 1, 10);

            expect(cacheService.retrieveGenericPaginated).toHaveBeenCalledWith(
                'cache-key',
                1,
                10,
                { userId, searchTerm: undefined },
                expect.any(Function),
                expect.any(Function),
            );
        });

        it('should call retrieveGenericPaginated with searchTerm when provided', async () => {
            await service.getUserProperties(userId, 2, 5, 'beach');

            expect(cacheService.retrieveGenericPaginated).toHaveBeenCalledWith(
                'cache-key',
                2,
                5,
                { userId, searchTerm: 'beach' },
                expect.any(Function),
                expect.any(Function),
            );
        });

        it('should return the paginated result from cache service', async () => {
            const result = await service.getUserProperties(userId, 1, 10);

            expect(result).toBe(paginatedResult);
        });

        it('inner fetcher callback should call retrieveUserProperties with correct args', async () => {
            await service.getUserProperties(userId, 1, 10, 'term');

            const fetcher = cacheService.retrieveGenericPaginated.mock.calls[0][4] as Function;
            (prePropertiesService.retrieveUserProperties as jest.Mock).mockResolvedValue([]);

            await fetcher(0, 10);

            expect(prePropertiesService.retrieveUserProperties).toHaveBeenCalledWith(
                userId,
                0,
                10,
                'term',
            );
        });

        it('inner transformer callback should call transformProperties', async () => {
            await service.getUserProperties(userId, 1, 10);

            const transformer = cacheService.retrieveGenericPaginated.mock.calls[0][5] as Function;
            const props = [makeProperty()];
            transformer(props);

            expect(transformPService.transformProperties).toHaveBeenCalledWith(props);
        });
    });

    describe('getPropertyDetails', () => {
        const mockCurrentUser = { id: 'user-1' } as any;
        const mockUserEntity = makeUser({ id: 'user-1' });
        const mockProperty = makeProperty({
            formattedAddress: '123 Main St',
            propertyType: 'Single Family',
            squareFootage: 1200,
            yearBuilt: 2005,
        } as any);

        beforeEach(() => {
            usersService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUserEntity);
            (prePropertiesService as any).getPropertyByCriteria = jest
                .fn()
                .mockResolvedValue(mockProperty);
        });

        it('should log the retrieval action', async () => {
            await service.getPropertyDetails(mockCurrentUser, 'prop-1');

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Retrieve a property with id: prop-1 details',
            );
        });

        it('should retrieve user by criteria using user.id', async () => {
            await service.getPropertyDetails(mockCurrentUser, 'prop-1');

            expect(usersService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: mockCurrentUser.id,
            });
        });

        it('should retrieve property by createdBy and id', async () => {
            await service.getPropertyDetails(mockCurrentUser, 'prop-1');

            expect((prePropertiesService as any).getPropertyByCriteria).toHaveBeenCalledWith({
                createdBy: { id: mockUserEntity.id },
                id: 'prop-1',
            });
        });

        it('should return only address, propertyType, squareFootage, yearBuilt', async () => {
            const result = await service.getPropertyDetails(mockCurrentUser, 'prop-1');

            expect(result).toEqual({
                address: mockProperty.formattedAddress,
                propertyType: mockProperty.propertyType,
                squareFootage: mockProperty.squareFootage,
                yearBuilt: mockProperty.yearBuilt,
            });
        });

        it('should propagate errors from retrieveUserByCriteria', async () => {
            usersService.preUserService.retrieveUserByCriteria.mockRejectedValueOnce(
                new Error('User not found'),
            );

            await expect(service.getPropertyDetails(mockCurrentUser, 'prop-1')).rejects.toThrow(
                'User not found',
            );
        });

        it('should propagate errors from getPropertyByCriteria', async () => {
            (prePropertiesService as any).getPropertyByCriteria = jest
                .fn()
                .mockRejectedValueOnce(new Error('Property not found'));

            await expect(service.getPropertyDetails(mockCurrentUser, 'prop-1')).rejects.toThrow(
                'Property not found',
            );
        });
    });

    describe('getOrCreateProperty', () => {
        const createdBy = makeUser();
        const propertyId = 'rentcast-id-1';
        const existingProperty = makeProperty({ id: propertyId });
        const rentCastData = {
            rentCastId: propertyId,
            formattedAddress: '123 Main St, Springfield, IL 62701',
            addressLine1: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            stateFips: '17',
            zipCode: '62701',
            county: 'Sangamon',
            countyFips: '167',
            latitude: 39.78,
            longitude: -89.65,
            propertyType: 'Single Family',
        };
        const builtEntity = makeProperty();
        const relations = ['createdBy'];

        beforeEach(() => {
            transformPService.createPropertyEntity.mockReturnValue(relations as any);
        });

        it('should log the start of getOrCreate with userId and propertyId', async () => {
            propertiesRepo.findOne.mockResolvedValue(existingProperty);

            await service.getOrCreateProperty(createdBy, propertyId);

            expect(mockLogger.info).toHaveBeenCalledWith('[Property] Start getOrCreate', {
                userId: createdBy.id,
                propertyId,
            });
        });

        it('should return immediately when property exists by id', async () => {
            propertiesRepo.findOne.mockResolvedValue(existingProperty);

            const result = await service.getOrCreateProperty(createdBy, propertyId);

            expect(result).toBe(existingProperty);
            expect(propertiesRepo.findOne).toHaveBeenCalledTimes(1);
            expect(propertiesRepo.findOne).toHaveBeenCalledWith({
                where: { id: propertyId, createdBy: { id: createdBy.id } },
                relations,
            });
            expect(rentCastService.getProperty).not.toHaveBeenCalled();
            expect(propertiesRepo.create).not.toHaveBeenCalled();
        });

        it('should check by formattedAddress when property not found by id', async () => {
            propertiesRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(existingProperty);

            rentCastService.getProperty.mockResolvedValue(rentCastData as any);

            const result = await service.getOrCreateProperty(createdBy, propertyId);

            expect(rentCastService.getProperty).toHaveBeenCalledWith(propertyId);
            expect(propertiesRepo.findOne).toHaveBeenCalledTimes(2);
            expect(propertiesRepo.findOne).toHaveBeenNthCalledWith(2, {
                where: {
                    formattedAddress: rentCastData.formattedAddress,
                    createdBy: { id: createdBy.id },
                },
                relations,
            });
            expect(result).toBe(existingProperty);
            expect(propertiesRepo.create).not.toHaveBeenCalled();
        });

        it('should create a new property when not found by id nor by formattedAddress', async () => {
            propertiesRepo.findOne.mockResolvedValue(null);
            rentCastService.getProperty.mockResolvedValue(rentCastData as any);
            prePropertiesService.buildPropertyEntity.mockReturnValue(builtEntity);
            propertiesRepo.create.mockResolvedValue(builtEntity);

            const result = await service.getOrCreateProperty(createdBy, propertyId);

            expect(prePropertiesService.buildPropertyEntity).toHaveBeenCalledWith(
                rentCastData,
                createdBy,
            );
            expect(propertiesRepo.create).toHaveBeenCalledWith(builtEntity);
            expect(result).toBe(builtEntity);
        });

        it('should invalidate the cache after creating a new property', async () => {
            propertiesRepo.findOne.mockResolvedValue(null);
            rentCastService.getProperty.mockResolvedValue(rentCastData as any);
            prePropertiesService.buildPropertyEntity.mockReturnValue(builtEntity);
            propertiesRepo.create.mockResolvedValue(builtEntity);

            await service.getOrCreateProperty(createdBy, propertyId);

            expect(prePropertiesService.invalidatePCache).toHaveBeenCalledWith(createdBy.id);
        });

        it('should NOT invalidate cache when property is found by id', async () => {
            propertiesRepo.findOne.mockResolvedValue(existingProperty);

            await service.getOrCreateProperty(createdBy, propertyId);

            expect(prePropertiesService.invalidatePCache).not.toHaveBeenCalled();
        });

        it('should NOT invalidate cache when property is found by formattedAddress', async () => {
            propertiesRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(existingProperty);

            rentCastService.getProperty.mockResolvedValue(rentCastData as any);

            await service.getOrCreateProperty(createdBy, propertyId);

            expect(prePropertiesService.invalidatePCache).not.toHaveBeenCalled();
        });

        it('should propagate errors from rentCastService.getProperty', async () => {
            propertiesRepo.findOne.mockResolvedValue(null);
            rentCastService.getProperty.mockRejectedValue(new Error('RentCast API error'));

            await expect(service.getOrCreateProperty(createdBy, propertyId)).rejects.toThrow(
                'RentCast API error',
            );
        });

        it('should propagate errors from propertiesRepo.create', async () => {
            propertiesRepo.findOne.mockResolvedValue(null);
            rentCastService.getProperty.mockResolvedValue(rentCastData as any);
            prePropertiesService.buildPropertyEntity.mockReturnValue(builtEntity);
            propertiesRepo.create.mockRejectedValue(new Error('DB error'));

            await expect(service.getOrCreateProperty(createdBy, propertyId)).rejects.toThrow(
                'DB error',
            );
        });

        it('should use relations from transformPService.createPropertyEntity for both findOne calls', async () => {
            const customRelations = ['createdBy', 'someOtherRelation'];
            transformPService.createPropertyEntity.mockReturnValue(customRelations as any);

            propertiesRepo.findOne.mockResolvedValue(null);
            rentCastService.getProperty.mockResolvedValue(rentCastData as any);
            propertiesRepo.create.mockResolvedValue(builtEntity);

            await service.getOrCreateProperty(createdBy, propertyId);

            expect(propertiesRepo.findOne).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ relations: customRelations }),
            );
            expect(propertiesRepo.findOne).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ relations: customRelations }),
            );
        });
    });
});
