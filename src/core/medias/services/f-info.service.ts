import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { MediasService } from './medias.service';
import { UpdateInfoDto } from '../dto/update-info.dto';

@Injectable()
export class FInfoService {
    /**
     * Service responsible for updating footer information
     */

    constructor(
        @Inject(forwardRef(() => MediasService))
        private readonly mediasService: MediasService,
    ) {}

    /**
     * Retrieves footer information for the platform, including contact details and social media links.
     * Logs the action and returns the relevant fields for a non-deleted footer info record.
     */
    async footerInfo() {
        this.mediasService.logger.info(`Retrieving footer information`);

        return await this.mediasService.fInfoRepo.findOne({
            where: { deleted: false },
            select: [
                'phoneNumber',
                'email',
                'facebook',
                'instagram',
                'linkedIn',
                'twitter',
                'discord',
            ],
        });
    }

    /**
     * Updates footer information with the provided DTO.
     * Logs the action, validates the phone number if provided, applies updates to the existing record,
     * and returns a success message upon completion.
     */
    async updateFInfo(updateDto: UpdateInfoDto) {
        this.mediasService.logger.info(`Updating footer information`);
        const { email, instagram, phoneNumber, discord, linkedIn, twitter, facebook } = updateDto;

        const data = await this.mediasService.fInfoRepo.findOne({
            where: { deleted: false },
        });

        if (!data)
            this.mediasService.errorHandler.notFound(
                `Footer information not found`,
                `Information not found.`,
            );

        if (email) data.email = email;
        if (instagram) data.instagram = instagram;
        if (discord) data.discord = discord;
        if (linkedIn) data.linkedIn = linkedIn;
        if (twitter) data.twitter = twitter;
        if (facebook) data.facebook = facebook;
        if (phoneNumber) {
            this.mediasService.otherUtils.validateAndParsePhone(phoneNumber);
            data.phoneNumber = phoneNumber;
        }

        await this.mediasService.fInfoRepo.update({ id: data.id }, data);

        return { message: 'Footer information updated successfully' };
    }
}
