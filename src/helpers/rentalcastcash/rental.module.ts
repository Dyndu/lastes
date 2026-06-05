import { HttpModule } from '@nestjs/axios';
import { RentalService } from './rental.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [HttpModule],
    providers: [RentalService],
    exports: [RentalService],
})
export class RentalModule {}
