import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RoleEntity } from './entities/role.entity';
import { RolesRepository } from './roles.repository';
import { RolesSeeder } from './roles.seeder';
import { RolesService } from './roles.service';

@Global()
@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([RoleEntity])],
    providers: [RolesSeeder, RolesRepository, RolesService],
    exports: [RolesRepository, RolesService],
})
export class RolesModule {}
