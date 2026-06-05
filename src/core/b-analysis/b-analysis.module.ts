import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import {
    BAnalysisEntity,
    RoomCategoryEntity,
    RoomSectionEntity,
    RoomExpenseItemEntity,
} from './entities';
import {
    BAnalysisRepository,
    RoomCategoryRepository,
    RoomSectionRepository,
    RoomExpenseItemRepository,
} from './repositories';
import {
    BAnalysisService,
    RoomCategoryService,
    RoomSectionService,
    RoomExpenseItemService,
    TransformBAEntitiesService,
} from './services';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([
            BAnalysisEntity,
            RoomCategoryEntity,
            RoomSectionEntity,
            RoomExpenseItemEntity,
        ]),
    ],
    providers: [
        BAnalysisRepository,
        RoomCategoryRepository,
        RoomSectionRepository,
        RoomExpenseItemRepository,
        BAnalysisService,
        RoomCategoryService,
        RoomSectionService,
        RoomExpenseItemService,
        TransformBAEntitiesService,
    ],
    exports: [BAnalysisService],
})
export class BAnalysisModule {}
