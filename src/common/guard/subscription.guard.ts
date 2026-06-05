import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionStatusEnum } from '../enum';
import { ErrorHandlerService } from '../response';

export const REQUIRE_SUBSCRIPTION = 'requireSubscription';
export const RequireSubscription = () => SetMetadata(REQUIRE_SUBSCRIPTION, true);

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly errorHandler: ErrorHandlerService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_SUBSCRIPTION, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!required) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) return false;

        if (!user.subId)
            this.errorHandler.forbidden('No active subscription. Please subscribe to continue.');

        if (
            [
                SubscriptionStatusEnum.CANCELED,
                SubscriptionStatusEnum.INCOMPLETE_EXPIRED,
                SubscriptionStatusEnum.UNPAID,
            ].includes(user.subStatus)
        )
            this.errorHandler.forbidden('Your subscription is no longer active.');

        return true;
    }
}
