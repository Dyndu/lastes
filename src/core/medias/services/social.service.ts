import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { MediasService } from './medias.service';
import { SocketEventEnum } from '../../../common/enum';

@Injectable()
export class SocialService {
    /**
     * Service responsible for handling social operation
     */

    constructor(
        @Inject(forwardRef(() => MediasService))
        private readonly mediasService: MediasService,
    ) {}

    /**
     * Fetches all non-deleted social networks.
     * Logs the retrieval and returns their basic information (ID, label, and active status).
     */
    async allSocials() {
        this.mediasService.logger.info('All social networks');

        return await this.mediasService.socialRepository.find({
            where: { deleted: false },
            select: ['id', 'label', 'isActive'],
        });
    }

    /**
     * Toggles the active state of a social network by its ID.
     * Logs the action, verifies existence, updates the active status, and returns a success message.
     */
    async toggleSocial(id: string) {
        this.mediasService.logger.info(`Toggle Social Service with id ${id}`);

        const isDataExist = await this.mediasService.socialRepository.findOne({
            where: { id, deleted: false },
        });

        if (!isDataExist)
            this.mediasService.errorHandler.notFound(
                `Social network with id: ${id} not found`,
                `Social not found`,
            );

        await this.mediasService.socialRepository.update(
            { id },
            { isActive: !isDataExist.isActive },
        );
        const newData = await this.mediasService.socialRepository.findOne({
            where: { id, deleted: false },
            select: ['id', 'label', 'isActive'],
        });
        this.mediasService.socketService.sendDataToRoute(
            '/social',
            SocketEventEnum.SOCIAL_NETWORK_UPDATED,
            [
                {
                    payload: newData!,
                },
            ],
        );
        return {
            message: `Social network ${isDataExist.isActive ? ' deactivate' : ' active'} successfully`,
        };
    }
}
