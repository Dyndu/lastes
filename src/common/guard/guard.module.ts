import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { GoogleStrategy } from './google.strategy';
import { GoogleOAuthGuard } from './google-oauth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsGuard } from './permissions.guard';
import { SubscriptionGuard } from './subscription.guard';

@Global()
@Module({
    providers: [
        JwtAuthGuard,
        GoogleStrategy,
        GoogleOAuthGuard,
        JwtStrategy,
        PermissionsGuard,
        SubscriptionGuard,
    ],
    exports: [
        JwtAuthGuard,
        GoogleStrategy,
        GoogleOAuthGuard,
        JwtStrategy,
        PermissionsGuard,
        SubscriptionGuard,
    ],
})
export class GuardModule {}
