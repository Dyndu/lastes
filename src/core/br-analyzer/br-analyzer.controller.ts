import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '../../common';
import {
    ApiResponseDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    CurrentUser,
    NonAdminOnly,
} from '../../common/decorators';
import type { CurrentUserInterface } from '../../interface';
import { JwtAuthGuard, PermissionsGuard, SubscriptionGuard } from '../../common/guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BrAnalyzerService } from './services';
import { ADetailsDto } from '../a-builder/dto';
import { CreateBrBuilderDto } from './dto/create-br-builder.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('brrrr-analyzer')
export class BrAnalyzerController {
    constructor(private readonly brAnalyzerService: BrAnalyzerService) {}

    @Get('/summary/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis full summary', 'Get analysis full summary')
    @ApiResponseDecorator(200, 'Analysis summary retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getBrAnalyzerFullSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.brAnalyzerService.getBrAnalyzerFullBreakdown(user, id);
    }

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getBrAnalyzerAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.brAnalyzerService.getBrAnalyzerAnalysisBuilder(user, id);
    }

    @Post('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Upsert brrrr analyzer builder',
        'Create or update brrrr analyzer builder for a brrrr analyzer analysis',
    )
    @ApiResponseDecorator(201, 'Property details upserted successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveBrrrAnalyzerBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateBrBuilderDto,
    ) {
        return this.brAnalyzerService.resolveBrAnalyzerBuilder(user, id, dto);
    }

    @Post('/cash-to-close')
    @ApiOperationDecorator(
        'Calculate acquisition details cash to close',
        'Calculate acquisition details cash to close',
    )
    @ApiResponseDecorator(201, 'Data calculated successfully')
    @ApiResponseDecorator(400, 'Invalid refinance data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async cashToClose(@Body() dto: ADetailsDto) {
        return this.brAnalyzerService.rAnalyzerService.aBuilderService.aDetailsService.calculateCashNeededToClose(
            dto.closingCostFees,
            dto.downPayment,
        );
    }
}
