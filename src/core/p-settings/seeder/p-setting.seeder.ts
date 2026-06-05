import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PSettingRepository } from '../repositories';
import { PSettingEntity } from '../entities';
import { IsNull } from 'typeorm';

@Injectable()
export class PSettingSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly pSettingRepo: PSettingRepository,
    ) {}

    async seed() {
        this.logger.info('[Setting seeder] Seeding started');

        const existingSetting = await this.pSettingRepo.findOne({
            where: { deleted: false, isDefault: true, createdBy: IsNull() },
        });

        if (!existingSetting) {
            const newSetting = new PSettingEntity();
            newSetting.isDefault = true;
            newSetting.label = 'Default Profile';
            await this.pSettingRepo.create(newSetting);
        }
    }
}
