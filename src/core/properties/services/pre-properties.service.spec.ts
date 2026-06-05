import { Test, TestingModule } from '@nestjs/testing';
import { PrePropertiesService } from './pre-properties.service';
import { PropertiesService } from './properties.service';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ExistenceCheckModeEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PrePropertiesService', () => {
    let service: PrePropertiesService;

    const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
    };

    const mockRepo = {
        getRepository: jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        }),
        findActiveOne: jest.fn(),
        assertUniqueActive: jest.fn(),
        update: jest.fn(),
    };

    const mockLogger = { info: jest.fn() };
    const mockErrorHandler = {
        notFound: jest.fn(),
        validation: jest.fn().mockReturnValue(new Error('Validation error')),
    };
    const mockOtherUtils = {
        formatCriteria: jest.fn().mockReturnValue('id = 1'),
        assertState: jest.fn(),
    };
    const mockCacheService = { deleteKeysByBase: jest.fn() };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PrePropertiesService,
                {
                    provide: PropertiesService,
                    useValue: {
                        propertiesRepo: mockRepo,
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        otherUtils: mockOtherUtils,
                        cacheService: mockCacheService,
                    },
                },
            ],
        }).compile();

        service = module.get<PrePropertiesService>(PrePropertiesService);
        module.get(PropertiesService);
    });

    describe('basePropertyBaseQuery', () => {
        it('should build base query without userId or searchTerm', () => {
            const result = service.basePropertyBaseQuery({});

            expect(mockRepo.getRepository).toHaveBeenCalled();
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'property.createdBy',
                'createdBy',
            );
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('property.deleted = false');
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
            expect(result).toBe(mockQueryBuilder);
        });

        it('should apply userId filter when provided', () => {
            service.basePropertyBaseQuery({ userId: 'user-1' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-1',
            });
        });

        it('should apply searchTerm filter when provided', () => {
            service.basePropertyBaseQuery({ searchTerm: 'abc' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                `(property.city ILIKE :searchTerm \n            OR property.state ILIKE :searchTerm \n            OR property.zipCode ILIKE :searchTerm)`,
                { searchTerm: '%abc%' },
            );
        });

        it('should apply both userId and searchTerm filters when both provided', () => {
            service.basePropertyBaseQuery({
                userId: 'user-1',
                searchTerm: 'ab',
            });

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
        });
    });

    describe('buildPropertyEntity', () => {
        const baseDto = {
            rentCastId: 'rc-1',
            formattedAddress: '123 Main St, Springfield, IL 62701',
            addressLine1: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            stateFips: '17',
            zipCode: '62701',
            county: 'Sangamon',
            countyFips: '167',
            latitude: 39.7817,
            longitude: -89.6501,
            propertyType: 'Single Family',
        };

        it('should build a property entities with all required fields', () => {
            const user = { id: 'user-1' } as UserEntity;
            const result = service.buildPropertyEntity(baseDto, user);

            expect(result).toBeInstanceOf(PropertyEntity);
            expect(result.rentCastId).toBe('rc-1');
            expect(result.formattedAddress).toBe('123 Main St, Springfield, IL 62701');
            expect(result.addressLine1).toBe('123 Main St');
            expect(result.city).toBe('Springfield');
            expect(result.state).toBe('IL');
            expect(result.stateFips).toBe('17');
            expect(result.zipCode).toBe('62701');
            expect(result.county).toBe('Sangamon');
            expect(result.countyFips).toBe('167');
            expect(result.latitude).toBe(39.7817);
            expect(result.longitude).toBe(-89.6501);
            expect(result.propertyType).toBe('Single Family');
            expect(result.createdBy).toBe(user);
        });

        it('should set optional fields when provided', () => {
            const user = { id: 'user-1' } as UserEntity;
            const dto = {
                ...baseDto,
                addressLine2: 'Apt 4B',
                bedrooms: 3,
                bathrooms: 2,
                squareFootage: 1500,
                lotSize: 6000,
                yearBuilt: 1995,
            };

            const result = service.buildPropertyEntity(dto, user);

            expect(result.addressLine2).toBe('Apt 4B');
            expect(result.bedrooms).toBe(3);
            expect(result.bathrooms).toBe(2);
            expect(result.squareFootage).toBe(1500);
            expect(result.lotSize).toBe(6000);
            expect(result.yearBuilt).toBe(1995);
        });

        it('should leave optional fields undefined when not provided', () => {
            const user = { id: 'user-1' } as UserEntity;
            const result = service.buildPropertyEntity(baseDto, user);

            expect(result.addressLine2).toBeUndefined();
            expect(result.bedrooms).toBeUndefined();
            expect(result.bathrooms).toBeUndefined();
            expect(result.squareFootage).toBeUndefined();
            expect(result.lotSize).toBeUndefined();
            expect(result.yearBuilt).toBeUndefined();
        });
    });

    describe('retrieveUserProperties', () => {
        it('should build query with pagination and ordering', () => {
            const result = service.retrieveUserProperties('user-1', 0, 10);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('property.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result).toBe(mockQueryBuilder);
        });

        it('should apply userId filter via base query', () => {
            service.retrieveUserProperties('user-1', 0, 10);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-1',
            });
        });

        it('should apply searchTerm filter when provided', () => {
            service.retrieveUserProperties('user-1', 5, 20, 'test');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('property.city ILIKE :searchTerm'),
                { searchTerm: '%test%' },
            );
        });

        it('should respect offset and limit values', () => {
            service.retrieveUserProperties('user-1', 20, 5);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
        });
    });

    describe('getPropertyByCriteria', () => {
        const criteria = { id: 'prop-1' };
        const mockProperty = { id: 'prop-1' } as PropertyEntity;

        it('should return the property when found', async () => {
            mockRepo.findActiveOne.mockResolvedValue(mockProperty);

            const result = await service.getPropertyByCriteria(criteria);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRepo.findActiveOne).toHaveBeenCalledWith(mockRepo, criteria, undefined);
            expect(result).toBe(mockProperty);
        });

        it('should return the property with relations when provided', async () => {
            mockRepo.findActiveOne.mockResolvedValue(mockProperty);

            const result = await service.getPropertyByCriteria(criteria, ['createdBy']);

            expect(mockRepo.findActiveOne).toHaveBeenCalledWith(mockRepo, criteria, ['createdBy']);
            expect(result).toBe(mockProperty);
        });

        it('should throw notFound error when property does not exist', async () => {
            mockRepo.findActiveOne.mockResolvedValue(null);

            await service.getPropertyByCriteria(criteria);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Property not found with criteria: id = 1',
                'Property not found',
            );
        });
    });

    describe('assertPropertyOwnership', () => {
        it('should call assertState with correct arguments', () => {
            const user = { id: 'user-1' } as UserEntity;
            const property = {
                id: 'prop-1',
                createdBy: user,
            } as PropertyEntity;

            service.assertPropertyOwnership('user-1', property);

            expect(mockOtherUtils.assertState).toHaveBeenCalledWith(
                'user-1',
                'user-1',
                ExistenceCheckModeEnum.MUST_EXIST,
            );
        });

        it('should call assertState even when userId does not match (let assertState handle the error)', () => {
            const owner = { id: 'owner-1' } as UserEntity;
            const property = {
                id: 'prop-1',
                createdBy: owner,
            } as PropertyEntity;

            service.assertPropertyOwnership('other-user', property);

            expect(mockOtherUtils.assertState).toHaveBeenCalledWith(
                'owner-1',
                'other-user',
                ExistenceCheckModeEnum.MUST_EXIST,
            );
        });
    });

    describe('ensurePLabelUFUpdate', () => {
        const property = {
            id: 'prop-1',
            createdBy: { id: 'user-1' },
        } as PropertyEntity;

        it('should pass without throwing when formattedAddress is unique for update', async () => {
            mockRepo.assertUniqueActive.mockResolvedValue(undefined);

            await expect(
                service.ensurePLabelUFUpdate(property, '123 New St'),
            ).resolves.not.toThrow();

            expect(mockRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockRepo,
                {},
                {
                    formattedAddress: '123 New St',
                    createdBy: { id: 'user-1' },
                },
                'Property',
                'prop-1',
            );
        });

        it('should throw validation error when formattedAddress already exists for another property', async () => {
            mockRepo.assertUniqueActive.mockImplementation(async (_repo, errors) => {
                errors['formattedAddress'] = 'Property already exists';
            });

            await expect(
                service.ensurePLabelUFUpdate(property, 'Duplicate Address'),
            ).rejects.toThrow('Validation error');

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                formattedAddress: 'Property already exists',
            });
        });
    });

    describe('invalidatePCache', () => {
        it('should call deleteKeysByBase with the correct pattern', async () => {
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.invalidatePCache('user-1');

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('properties-user-1');
        });

        it('should call deleteKeysByBase with pattern for a different userId', async () => {
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.invalidatePCache('user-42');

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('properties-user-42');
        });
    });
});
