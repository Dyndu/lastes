import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ModuleSeeder } from './module.seeder';
import {
    MUseRepository,
    ModulesRepository,
    MHeaderRepository,
    MFeatureRepository,
    MUsersRepository,
    MExportRepository,
} from './repositories';
import {
    MFeatureService,
    ModulesService,
    PreModuleService,
    MHeaderService,
    MUseService,
    MTransformService,
    MUsersService,
    MExportService,
} from './services';
import {
    ModuleEntity,
    MFeatureEntity,
    MHeaderEntity,
    MUseEntity,
    MUsersEntity,
    MExportEntity,
} from './entities';
import { ModulesController } from './modules.controller';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([
            ModuleEntity,
            MFeatureEntity,
            MHeaderEntity,
            MUseEntity,
            MUsersEntity,
            MExportEntity,
        ]),
        PermissionsModule,
    ],
    controllers: [ModulesController],
    providers: [
        MUsersService,
        ModuleSeeder,
        ModulesRepository,
        MHeaderRepository,
        MUseRepository,
        MFeatureRepository,
        MUsersRepository,
        MFeatureService,
        ModulesService,
        MTransformService,
        PreModuleService,
        MHeaderService,
        MUseService,
        MExportRepository,
        MExportService,
    ],
    exports: [ModulesService],
})
export class ModulesModule {}
