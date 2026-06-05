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
import { ADetailsDto, RefiCreateDto } from '../a-builder/dto';
import { IStrategyService } from './services';
import { CreateIStrategyBuilderDto } from './dto/create-i-strategy-builder.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('investment-strategy')
export class IStrategyController {
    constructor(private readonly iStrategyService: IStrategyService) {}

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getIStrategyAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.iStrategyService.getIStrategyAnalysisBuilder(user, id);
    }

    @Post('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Upsert property details',
        'Create or update property details for an investment strategy analysis',
    )
    @ApiResponseDecorator(201, 'Property details upserted successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveFFlipBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateIStrategyBuilderDto,
    ) {
        return this.iStrategyService.resolveIStrategyBuilder(user, id, dto);
    }

    @Post('/cash-need-to-close')
    @ApiOperationDecorator('Calculate cash needed to close', 'Calculate cash needed to close')
    @ApiResponseDecorator(200, 'Data calculated successfully')
    @ApiResponseDecorator(400, 'Invalid acquisition details data')
    @ApiResponseDecorator(403, 'Access denied')
    cashNeedToClose(@Body() dto: ADetailsDto) {
        return this.iStrategyService.calculateCashNeedToClose(dto);
    }

    @Post('/cash-out-close')
    @ApiOperationDecorator('Calculate cash out for refi', 'Calculate cash out for refi')
    @ApiResponseDecorator(200, 'Data calculated successfully')
    @ApiResponseDecorator(400, 'Invalid data')
    @ApiResponseDecorator(403, 'Access denied')
    cashOutForRefi(@Body() dto: RefiCreateDto) {
        return this.iStrategyService.cashOutForRefi(dto);
    }

    @Post('/refi-point-value')
    @ApiOperationDecorator('Determine refinance point amount', 'Determine refinance point amount')
    @ApiResponseDecorator(200, 'Refinance point calculated successfully')
    @ApiResponseDecorator(400, 'Invalid refinance data')
    @ApiResponseDecorator(403, 'Access denied')
    async calculateRefiPoint(@Body() dto: RefiCreateDto) {
        return this.iStrategyService.rAnalyzerService.aBuilderService.refinanceService.determineNewAmount(
            dto.oldLoanAmount,
            dto.point,
        );
    }

    @Post('/refi-new-loan-amount')
    @ApiOperationDecorator(
        'Determine refinance new loan amount',
        'Determine refinance new loan amount',
    )
    @ApiResponseDecorator(200, 'Refinance new loan calculated successfully')
    @ApiResponseDecorator(400, 'Invalid refinance data')
    @ApiResponseDecorator(403, 'Access denied')
    async calculateRefiNewLoan(@Body() dto: RefiCreateDto) {
        return this.iStrategyService.rAnalyzerService.aBuilderService.refinanceService.determineNewAmount(
            dto.afterRepairValue,
            dto.refiLTV,
        );
    }

    @Post('/refi-out-cash')
    @ApiOperationDecorator('Determine refinance total cash', 'Determine refinance total cash')
    @ApiResponseDecorator(200, 'Refinance total calculated successfully')
    @ApiResponseDecorator(400, 'Invalid refinance data')
    @ApiResponseDecorator(403, 'Access denied')
    async calculateRefiTotalCash(@Body() dto: RefiCreateDto) {
        return this.iStrategyService.rAnalyzerService.aBuilderService.refinanceService.calculateRefiCash(
            dto.afterRepairValue,
            dto.refiLTV,
            dto.oldLoanAmount,
        );
    }

    @Get('/summary/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get investment strategy summary',
        'Compares Wholesale, Fix & Flip, and Long Term Rental strategies side by side for the same property',
    )
    @ApiResponseDecorator(200, 'Investment strategy summary computed successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getIStrategySummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.iStrategyService.iStrategySummaryService.getIStrategySummary(user, id);
    }
}
