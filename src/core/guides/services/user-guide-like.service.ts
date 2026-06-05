import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { GuideReactionEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';
import { GuideEntity, UserGuideLikeEntity } from '../entities';

@Injectable()
export class UserGuideLikeService {
    /**
     * Service responsible for handling user like and unlike guide
     */

    constructor(
        @Inject(forwardRef(() => GuidesService))
        private readonly guidesService: GuidesService,
    ) {}

    /**
     * Sets or updates a user's reaction to a guide.
     * Checks for an existing like link; updates it if found, otherwise creates a new one.
     * Clears relevant cache entries after updating the reaction.
     * Returns a success message upon completion.
     */
    async setGuideReaction(
        user: UserEntity,
        guide: GuideEntity,
        reaction: GuideReactionEnum | null,
    ) {
        const isLinkExist = await this.guidesService.uGLikesRepo.findOne({
            where: { user: { id: user.id }, deleted: false },
        });

        if (isLinkExist)
            await this.guidesService.uGLikesRepo.update(
                { id: isLinkExist.id },
                { reaction: reaction! },
            );
        else {
            const data = new UserGuideLikeEntity();
            data.guide = guide;
            data.user = user;
            data.reaction = reaction!;

            await this.guidesService.uGLikesRepo.create(data);
        }

        await this.guidesService.cacheService.deleteKeysByBase('guides');

        return { message: 'Guide reaction set successfully' };
    }
}
