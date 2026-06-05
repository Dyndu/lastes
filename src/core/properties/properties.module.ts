import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { PropertyEntity } from './entities/property.entity';
import { PropertiesController } from './properties.controller';
import {
    PropertiesService,
    PrePropertiesService,
    TransformPropertyEntityService,
} from './services';
import { PropertiesRepository } from './properties.repository';
import { RentalModule } from '../../helpers/rentalcastcash/rental.module';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([PropertyEntity]), RentalModule],
    controllers: [PropertiesController],
    providers: [
        PropertiesService,
        PrePropertiesService,
        PropertiesRepository,
        TransformPropertyEntityService,
    ],
    exports: [PropertiesService],
})
export class PropertiesModule {}
