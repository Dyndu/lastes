import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { EnvConfigService } from '../../utils/services/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly envConfig: EnvConfigService) {
        super({
            clientID: envConfig.googleClientID,
            clientSecret: envConfig.googleClientSecret,
            callbackURL: envConfig.googleCallbackUrl,
            scope: ['email', 'profile'],
        });
    }

    /**
     * Validates a Google authentication profile and constructs a user object
     * containing Google ID, email, name, profile picture, and OAuth tokens.
     * Invokes the callback with the user object on success.
     */
    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;

        const user = {
            googleId: id,
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
            refreshToken,
        };

        done(null, user);
    }
}
