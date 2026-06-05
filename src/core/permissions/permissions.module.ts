import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionsService } from './permissions.service';
import { PermissionSeeder } from './permissions.seeder';
import { PermissionRepository } from './permissions.repository';
import { PermissionsController } from './permissions.controller';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([PermissionEntity])],
    controllers: [PermissionsController],
    providers: [PermissionsService, PermissionSeeder, PermissionRepository],
    exports: [PermissionsService, PermissionRepository],
})
export class PermissionsModule {}
