import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';
import { DatasetsRepository } from './repositories/datasets.repository';
import { DatasetBatchRepository } from './repositories/dataset-batch.repository';
import { DatasetBatchEntity } from './entities/dataset-batch.entity';
import { DatasetEntity } from './entities/dataset.entity';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([DatasetBatchEntity, DatasetEntity])],
    controllers: [DatasetsController],
    providers: [DatasetsService, DatasetsRepository, DatasetBatchRepository],
    exports: [DatasetsService],
})
export class DatasetsModule {}
