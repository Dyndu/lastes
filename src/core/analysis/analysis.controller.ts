import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
    Patch,
    Query,
} from '../../common';
import {
    ApiResponseDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    CurrentUser,
    NonAdminOnly,
    ApiQueryDecorator,
    AdminViewDecorator,
} from '../../common/decorators';
import type { CurrentUserInterface } from '../../interface';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './services';
import { FieldDto, PaginationDto } from '../../common/dto';
import { AnalysisCreateDto } from './dto/analysis-create.dto';
import { UsagePeriod } from '../../common/enum';
import { AnalysisDuplicateDto } from './dto/analysis-duplicate.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('analysis')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) {}

    @NonAdminOnly()
    @Get('/:id')
    @ApiParamDecorator('module')
    @ApiOperationDecorator('Get user analysis', 'Retrieve user analysis based on module')
    @ApiResponseDecorator(200, 'List retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter analysis by search term',
        type: 'string',
    })
    async getAnalysisByModule(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Query() pagination: PaginationDto,
        @Query('search') search?: string,
    ) {
        return this.analysisService.getUserModuleAnalyses(
            user.id,
            id,
            pagination.getPage(),
            pagination.getLimit(),
            search,
        );
    }

    @NonAdminOnly()
    @Get('id')
    @ApiParamDecorator('analysisId')
    @ApiOperationDecorator('Get an analysis', 'Get an analysis details for user')
    @ApiResponseDecorator(200, 'Analysis retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async analysisDetails(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.analysisService.analysisDetails(user, id);
    }

    @NonAdminOnly()
    @Post()
    @ApiOperationDecorator('Create a new analysis', 'Create a new analysis for user')
    @ApiResponseDecorator(201, 'Analysis created successfully')
    @ApiResponseDecorator(400, 'Invalid analysis details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async createAnalysis(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: AnalysisCreateDto,
    ) {
        return this.analysisService.createAnalysis(user, dto);
    }

    @NonAdminOnly()
    @Patch(':id')
    @ApiParamDecorator('analysisId')
    @ApiOperationDecorator('Update an analysis', 'Update an analysis for user')
    @ApiResponseDecorator(201, 'Analysis update successfully')
    @ApiResponseDecorator(400, 'Invalid analysis details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async updateAnalysis(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: FieldDto,
    ) {
        return this.analysisService.updateAnalysis(user, id, dto.field);
    }

    @NonAdminOnly()
    @Post('duplicate')
    @ApiOperationDecorator('Duplicate an analysis', 'Duplicate an existing analysis for user')
    @ApiResponseDecorator(201, 'Analysis duplicated successfully')
    @ApiResponseDecorator(400, 'Invalid duplicate data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async duplicateAnalysis(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: AnalysisDuplicateDto,
    ) {
        return this.analysisService.duplicateAnalysis(user, dto);
    }

    @NonAdminOnly()
    @Patch('save-usage/:id')
    @ApiParamDecorator('analysisId')
    @ApiOperationDecorator('Save analysis usage', 'Save analysis usage for user')
    @ApiResponseDecorator(201, 'Analysis usage saved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async saveAnalysisUsage(@Param('id', ParseUUIDPipe) id: string) {
        return this.analysisService.saveUsage(id);
    }

    @AdminViewDecorator('statistics')
    @Get('stats/usages')
    @ApiQueryDecorator({
        name: 'period',
        description: 'Filter stats by period',
        enum: UsagePeriod,
    })
    @ApiOperationDecorator(
        'Retrieve total analysis usage by modules',
        'Retrieve total analysis usage by modules and other stats',
    )
    @ApiResponseDecorator(200, 'Statistics retrieved successfully')
    async totalUsageStats(@Query('period') period: UsagePeriod) {
        return this.analysisService.getTotalUsageStats(period);
    }

    @AdminViewDecorator('statistics')
    @Get('stats/usages-repartition')
    @ApiQueryDecorator({
        name: 'period',
        description: 'Filter stats by period',
        enum: UsagePeriod,
    })
    @ApiOperationDecorator(
        'Retrieve analysis usage repartition by modules',
        'Retrieve analysis usage repartition by modules and other stats',
    )
    @ApiResponseDecorator(200, 'Statistics retrieved successfully')
    async usageRepartition(@Query('period') period: UsagePeriod) {
        return this.analysisService.getUsageRepartition(period);
    }
}
