import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { GroupEntity } from './entities/group.entity';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { PermissionsModule } from '../permissions/permissions.module';
import { GroupsController } from './groups.controller';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([GroupEntity]), PermissionsModule],
    controllers: [GroupsController],
    providers: [GroupsService, GroupsRepository],
    exports: [GroupsService, GroupsRepository],
})
export class GroupsModule {}
