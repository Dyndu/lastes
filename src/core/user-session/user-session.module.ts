import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { UserSessionEntity } from './entities/user-session.entity';
import { UserSessionRepository } from './user-session.repository';
import { UserSessionService } from './services/user-session.service';
import { PreUserSessionService } from './services/pre-user-session.service';
import { GuardModule } from '../../common/guard';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([UserSessionEntity]), GuardModule],
    providers: [UserSessionRepository, UserSessionService, PreUserSessionService, JwtService],
    exports: [UserSessionRepository, UserSessionService, PreUserSessionService, JwtService],
})
export class UserSessionModule {}
