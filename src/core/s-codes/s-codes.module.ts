import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { SCodeEntity } from './entities/s-code.entity';
import { SCodesRepository } from './s-codes.repository';
import { SCodesService } from './s-codes.service';
import { SCodesController } from './s-codes.controller';
import { SCodesSeeder } from './s-codes.seeder';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([SCodeEntity])],
    controllers: [SCodesController],
    providers: [SCodesRepository, SCodesService, SCodesSeeder],
    exports: [SCodesRepository, SCodesService],
})
export class SCodesModule {}
