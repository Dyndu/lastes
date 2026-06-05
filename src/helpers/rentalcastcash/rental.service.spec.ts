import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { RentalService } from './rental.service';
import { EnvConfigService } from '../../utils/services/config';
import { RentalPropertyInterface } from '../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockHttpService = {
    get: jest.fn(),
};

const mockEnvConfigService = {
    rentalCastCashBaseUrl: 'https://api.rentalcast.com',
    rentalCastCashApiKey: 'test-api-key',
};

const makeRentalProperty = (
    overrides: Partial<RentalPropertyInterface> = {},
): RentalPropertyInterface => ({
    id: 'prop-uuid-1',
    rentCastId: 'rc-1',
    formattedAddress: '123 Main St, Austin, TX 78701',
    addressLine1: '123 Main St',
    addressLine2: null,
    city: 'Austin',
    state: 'TX',
    stateFips: 48,
    zipCode: 78701,
    county: 'Travis',
    countyFips: 48453,
    latitude: 30.2672,
    longitude: -97.7431,
    propertyType: 1,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1500,
    lotSize: 5000,
    yearBuilt: 2000,
    ...overrides,
});

describe('RentalService', () => {
    let service: RentalService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RentalService,
                { provide: HttpService, useValue: mockHttpService },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
            ],
        }).compile();

        service = module.get<RentalService>(RentalService);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize baseUrl from config', () => {
            expect(service['baseUrl']).toBe('https://api.rentalcast.com');
        });
    });

    describe('getProperty', () => {
        it('should call http.get with correct url and api key header', async () => {
            const property = makeRentalProperty();
            mockHttpService.get.mockReturnValue(of({ data: { data: property } }));

            await service.getProperty('rc-1');

            expect(mockHttpService.get).toHaveBeenCalledWith(
                'https://api.rentalcast.com/properties/details/rc-1',
                { headers: { 'x-api-key': 'test-api-key' } },
            );
        });

        it('should return the nested data.data from the response', async () => {
            const property = makeRentalProperty();
            mockHttpService.get.mockReturnValue(of({ data: { data: property } }));

            const result = await service.getProperty('rc-1');

            expect(result).toBe(property);
        });

        it('should return null when data.data is null', async () => {
            mockHttpService.get.mockReturnValue(of({ data: { data: null } }));

            const result = await service.getProperty('rc-unknown');

            expect(result).toBeNull();
        });
    });
});
