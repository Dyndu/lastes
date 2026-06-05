import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { UserEntity } from './entities/user.entity';
import {
    ResetPasswordRequestRepository,
    UsersCodeRepository,
    UsersRepository,
} from './repositories';
import {
    PreUserService,
    UsersService,
    UserCodeService,
    ResetPasswordRequestService,
    UsersEntityTransformService,
    UsersRelationsService,
    UserEmailSendingService,
} from './services';
import { RolesModule } from '../roles/roles.module';
import { AuthController } from './controllers/auth.controller';
import { UsersCodeEntity } from './entities/user-code.entity';
import { ResetPasswordRequestEntity } from './entities/reset-password-request.entity';
import { UsersController } from './controllers/users.controller';
import { GroupsModule } from '../groups/groups.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Global()
@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([UserEntity, UsersCodeEntity, ResetPasswordRequestEntity]),
        RolesModule,
        GroupsModule,
        PermissionsModule,
    ],
    controllers: [AuthController, UsersController],
    providers: [
        UsersRepository,
        UsersCodeRepository,
        UserEmailSendingService,
        ResetPasswordRequestRepository,
        PreUserService,
        UsersService,
        UserCodeService,
        ResetPasswordRequestService,
        UsersEntityTransformService,
        UsersRelationsService,
    ],
    exports: [
        UsersRepository,
        PreUserService,
        UsersService,
        UserEmailSendingService,
        UsersEntityTransformService,
    ],
})
export class UsersModule {}
