import {
    ApiBearerAuth,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    UseGuards,
} from '../../common';
import { JwtAuthGuard } from '../../common/guard';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    PaginationQueryDecorator,
} from '../../common/decorators';
import { FieldDto, PaginationDto } from '../../common/dto';
import { SCodesService } from './s-codes.service';
import { Patch, Post } from '@nestjs/common';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('s-codes')
export class SCodesController {
    constructor(private readonly sCodesService: SCodesService) {}

    @Get()
    @ApiOperationDecorator('All support codes', 'Retrieve support codes and transform to ui view')
    @ApiResponseDecorator(200, 'Support code retrieved successfully')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter support codes by key word',
        type: 'string',
    })
    async allSupportCodes(@Query() pagination: PaginationDto, @Query('search') search?: string) {
        return this.sCodesService.getAllSCodes(pagination.getPage(), pagination.getLimit(), {
            searchTerm: search,
        });
    }

    @AdminViewDecorator('help_support')
    @Get(':id')
    @ApiParamDecorator('support code')
    @ApiOperationDecorator(
        'Get a support by id',
        'Get a support by id and transform result to ui view',
    )
    @ApiResponseDecorator(200, 'Support code details retrieve successfully')
    @ApiResponseDecorator(404, 'Support code not found')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.sCodesService.retrieveSCodeByCriteria({ id });
    }

    @AdminViewDecorator('help_support')
    @Post()
    @ApiOperationDecorator('Create a new support code', 'Create a new support code')
    @ApiResponseDecorator(200, 'Support code retrieved successfully')
    @ApiResponseDecorator(400, 'Errors from validators')
    @ApiResponseDecorator(403, 'Forbidden')
    async createSupportCode(@Body() dto: FieldDto) {
        return this.sCodesService.createCode(dto.field);
    }

    @AdminViewDecorator('help_support')
    @Patch(':id')
    @ApiParamDecorator('support code')
    @ApiOperationDecorator('Update a new support code', 'Update a new support code')
    @ApiResponseDecorator(200, 'Support code retrieved successfully')
    @ApiResponseDecorator(400, 'Errors from validators')
    @ApiResponseDecorator(403, 'Forbidden')
    async updateSupportCode(@Param('id', ParseUUIDPipe) id: string, @Body() dto: FieldDto) {
        return this.sCodesService.updateCode(id, dto.field);
    }

    @AdminViewDecorator('help_support')
    @Delete(':id')
    @ApiParamDecorator('support code')
    @ApiOperationDecorator('Delete a new support code', 'Delete a new support code')
    @ApiResponseDecorator(200, 'Support code retrieved successfully')
    @ApiResponseDecorator(403, 'Forbidden')
    async deleteSupportCode(@Param('id', ParseUUIDPipe) id: string) {
        return this.sCodesService.deleteCode(id);
    }
}
