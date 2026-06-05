import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from '../../utils/services/config';
import { BasePropertyDto } from '../../core/properties/services';

@Injectable()
export class RentalService {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpService,
        private readonly config: EnvConfigService,
    ) {
        this.baseUrl = this.config.rentalCastCashBaseUrl;
    }

    /**
     * Asynchronously fetches a rental property's details by its ID from an external API.
     * Uses an HTTP GET request with an API key for authentication and returns the property data.
     */
    async getProperty(id: string): Promise<BasePropertyDto> {
        const { data } = await firstValueFrom(
            this.http.get(`${this.baseUrl}/properties/details/${id}`, {
                headers: {
                    'x-api-key': this.config.rentalCastCashApiKey,
                },
            }),
        );
        return data.data;
    }
}
