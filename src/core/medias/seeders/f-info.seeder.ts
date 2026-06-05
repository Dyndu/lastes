import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FooterInfoRepository } from '../repositories';
import { FooterInfoEntity } from '../entities';

const DEFAULT_FOOTER_INFO = {
    phoneNumber: '+12343243423',
    email: 'softvodooz@gmail.com',
};

@Injectable()
export class FInfoSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly fInfoRepo: FooterInfoRepository,
    ) {}

    async seed() {
        this.logger.info('Seeding footer information');

        const existingData = await this.fInfoRepo.findOne({
            where: { deleted: false },
        });

        if (existingData) this.logger.info('Footer information already exists');
        else {
            this.logger.info('Creating footer information');
            const data = new FooterInfoEntity();
            data.email = DEFAULT_FOOTER_INFO.email;
            data.phoneNumber = DEFAULT_FOOTER_INFO.phoneNumber;
            await this.fInfoRepo.create(data);
        }

        this.logger.info('Footer information seed successfully ended');
    }
}
