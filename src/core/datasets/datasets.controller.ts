import { Controller, Get, Post } from '../../common';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiResponseDecorator,
    PaginationQueryDecorator,
} from '../../common/decorators';
import { DatasetsService } from './datasets.service';
import { FieldDto, PaginationDto } from '../../common/dto';
import { Body, Query } from '@nestjs/common';

@AdminViewDecorator('datasets')
@Controller('datasets')
export class DatasetsController {
    constructor(private readonly dService: DatasetsService) {}

    @Get()
    @ApiOperationDecorator('Get all datasets', 'Get all datasets and transform to ui view')
    @PaginationQueryDecorator()
    @ApiResponseDecorator(200, 'Datasets retrieved successfully.')
    @ApiResponseDecorator(403, 'Access denied.')
    async allDatasets(@Query() pagination: PaginationDto) {
        return this.dService.getActiveDatasets(pagination.getPage(), pagination.getLimit());
    }

    @Get('last-batch')
    @ApiOperationDecorator(
        'Get last datasets batch',
        'Get last datasets batch and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Batch retrieved successfully.')
    @ApiResponseDecorator(403, 'Access denied.')
    async lastBatch() {
        return this.dService.getLastBatch();
    }

    @Get('batch-history')
    @ApiOperationDecorator('Get batch history', 'Get batch history and transform to ui view')
    @PaginationQueryDecorator()
    @ApiResponseDecorator(200, 'Batch history retrieved successfully.')
    @ApiResponseDecorator(403, 'Access denied.')
    async batchHistory(@Query() pagination: PaginationDto) {
        return this.dService.getBatchHistory(pagination.getPage(), pagination.getLimit());
    }

    @Post()
    @ApiOperationDecorator(
        'Set dataset',
        'Upload file and extract information form file to database',
    )
    @ApiResponseDecorator(201, 'Operation successful.')
    @ApiResponseDecorator(500, 'Error during file streaming.')
    @ApiResponseDecorator(403, 'Access denied.')
    async uploadDataset(@Body() dto: FieldDto) {
        return this.dService.importCsv(dto.field);
    }
}
