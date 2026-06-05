import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { CategoryEntity } from './entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesSeeder } from './categories.seeder';
import { CategoriesRepository } from './categories.repository';
import { CategoriesController } from './categories.controller';

@Global()
@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([CategoryEntity])],
    controllers: [CategoriesController],
    providers: [CategoriesSeeder, CategoriesRepository, CategoriesService],
    exports: [CategoriesRepository, CategoriesService],
})
export class CategoriesModule {}
