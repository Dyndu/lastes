import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CCodesService } from './c-codes.service';
import { CCodeEntity, CouponRedemptionEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class CRedemptionService {
    /**
     * Service responsible for ensuring coupon code are used once by each user
     */

    constructor(
        @Inject(forwardRef(() => CCodesService))
        readonly cCodeService: CCodesService,
    ) {}

    /**
     * Builds and returns a CouponRedemptionEntity populated with the required user and coupon relationships.
     * Creates a new entity instance, assigns the provided user and coupon properties, and returns the constructed entity.
     */
    buildCRedemptionEntity(required: { user: UserEntity; coupon: CCodeEntity }) {
        const result = new CouponRedemptionEntity();
        Object.assign(required, result);
        return result;
    }

    /**
     * Asserts that a coupon has not been redeemed by a user.
     * Checks for an existing redemption record for the given user and coupon combination.
     * If a redemption exists, throws a forbidden error indicating the coupon has already been redeemed.
     */
    async assertNotRedeemed(user: UserEntity, coupon: CCodeEntity) {
        const redemption = await this.cCodeService.cRedemptionRepository.findOne({
            where: { coupon: { id: coupon.id }, user: { id: user.id } },
        });

        if (redemption)
            this.cCodeService.errorHandler.forbidden(
                `User ${user.id} attempted to redeem coupon ${coupon.id} but has already used it`,
                `This coupon has already been redeemed`,
            );
    }

    /**
     * Creates a coupon redemption record for a user and coupon combination.
     * Checks if a redemption link already exists for the given user and coupon,
     * returns the existing record if found,
     * otherwise builds and creates a new redemption entity.
     */
    async createCRedemption(user: UserEntity, coupon: CCodeEntity) {
        const isLinkExist = await this.cCodeService.cRedemptionRepository.findOne({
            where: { coupon: { id: coupon.id }, user: { id: user.id } },
        });

        if (isLinkExist) return isLinkExist;
        const result = await this.cCodeService.cRedemptionRepository.create(
            this.buildCRedemptionEntity({ user, coupon }),
        );

        await this.cCodeService.preCCService.scheduleInvalidateCodesCache();
        return result;
    }
}
