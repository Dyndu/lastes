import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SocialRepository } from '../repositories';
import { SocialEntity } from '../entities';

const createSocial = (label: string) => ({
    label,
});

const allSocials = [
    createSocial('Facebook'),
    createSocial('Whatsapp'),
    createSocial('Instagram'),
    createSocial('X'),
    createSocial('LinkedIn'),
    createSocial('Discord'),
];

@Injectable()
export class SocialSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly socialRepository: SocialRepository,
    ) {}

    async seed() {
        this.logger.info('Seeding socials seed');

        const existingSocials = await this.socialRepository.find({
            where: { deleted: false },
        });

        const existingSocialsMap = new Map(
            existingSocials.map((social) => [social.label.trim(), social]),
        );

        for (const socialDef of allSocials) {
            const label = socialDef.label.trim();
            const existingSocial = existingSocialsMap.get(label);

            if (existingSocial) this.logger.info(`Social already exists: ${label}`);
            else {
                this.logger.info(`Creating social: ${label}`);
                const newSocial = new SocialEntity();
                newSocial.label = label;
                await this.socialRepository.create(newSocial);
            }
        }

        this.logger.info('Social seed successfully ended');
    }
}
