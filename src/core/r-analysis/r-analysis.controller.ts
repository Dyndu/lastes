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
import { RAnalysisService } from './services';
import { CreatePDetailsDto, ADetailsDto, FExpenseDto } from '../a-builder/dto';
import {
    RAnalysisDto,
    RentalSummaryDto,
    CreateRaBuilderDto,
    DealGradeDto,
    TaxDeductionDto,
    AppreciationDto,
    BuyHoldDto, DealComparisonDto,
} from './dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('rental-analyzer')
export class RAnalysisController {
    constructor(private readonly raService: RAnalysisService) {}

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getRaAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.raService.getRaAnalysisBuilder(user, id);
    }

    @Post('/fixed-expenses/monthly-breakdown/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get monthly expense breakdown',
        'Calculate the monthly expense breakdown for a rental analyzer analysis',
    )
    @ApiResponseDecorator(200, 'Monthly expense breakdown calculated successfully')
    @ApiResponseDecorator(400, 'Invalid fixed expenses data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getMonthlyExpenseBreakdown(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: FExpenseDto,
    ) {
        return this.raService.getMonthlyExpenseBreakdown(user, id, dto);
    }

    @Post('/fixed-expenses/total/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get fixed expenses total',
        'Calculate the total fixed expenses for a rental analyzer analysis',
    )
    @ApiResponseDecorator(200, 'Fixed expenses total calculated successfully')
    @ApiResponseDecorator(400, 'Invalid fixed expenses data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getFExpenseTotal(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: FExpenseDto,
    ) {
        return this.raService.getFExpenseTotal(user, id, dto);
    }

    @Post('/loan-coast')
    @ApiOperationDecorator('Get the loan coast', 'Determine the loan points coast from dto')
    @ApiResponseDecorator(200, 'Acquisition details retrieved successfully')
    async calculatePointCoast(@Body() dto: ADetailsDto) {
        return this.raService.aBuilderService.aDetailsService.calculateLoanPointsCost(dto);
    }

    @Post('/gross-income')
    @ApiOperationDecorator('Calculate grossly income', 'Calculate grossly income')
    @ApiResponseDecorator(200, 'Gross income calculated successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    async calculateGIncome(@Body() dto: CreatePDetailsDto) {
        return this.raService.calculatePDetailsGIncome(dto);
    }

    @Post('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Upsert rental analyzer builder',
        'Create or update rental analyzer builder for a rental analyzer analysis',
    )
    @ApiResponseDecorator(201, 'Property details upserted successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveRaBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateRaBuilderDto,
    ) {
        return this.raService.resolveRaBuilder(user, id, dto);
    }

    @Post('/analysis/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get rental analysis financing and income summary',
        'Computes LTV, down payment, estimated cash to close, P/I, yearly income, management fees, maintenance escrow, yearly and monthly cash flow',
    )
    @ApiResponseDecorator(200, 'Rental analysis summary computed successfully')
    @ApiResponseDecorator(400, 'Invalid summary input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getRentalAnalysisSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RAnalysisDto,
    ) {
        return this.raService.getRentalAnalysisSummary(user, id, dto);
    }

    @Post('/summary/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get full rental analysis summary page',
        'Computes tax deductions, break-even ratio, property appreciation, ROI, annualized ROI, combined ROI from all sources, and cumulative projections for 5, 10, and 15 years',
    )
    @ApiResponseDecorator(200, 'Full rental summary computed successfully')
    @ApiResponseDecorator(400, 'Invalid summary input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getRentalSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RentalSummaryDto,
    ) {
        return this.raService.getRentalSummary(user, id, dto);
    }

    @Post('/summary/metrics/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get rental analysis financial metrics',
        'Computes CoC, OER, debt yield, payback period, LTV ratio, cap rate, DSCR, equity multiplier, GRM, cash flow, LTC ratio, cost per unit, and income statement',
    )
    @ApiResponseDecorator(200, 'Rental metrics computed successfully')
    @ApiResponseDecorator(400, 'Invalid metrics input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getRentalMetrics(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RAnalysisDto,
    ) {
        return this.raService.getRentalMetrics(user, id, dto);
    }

    @Post('/full-breakdown/tax-deduction/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get full rental analysis full breakdown tax deduction page',
        'Computes tax deductions cumulative projections for 5, 10, and 15 years',
    )
    @ApiResponseDecorator(200, 'Full breakdown tax deduction computed successfully')
    @ApiResponseDecorator(400, 'Invalid tax deduction input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getTaxDeductionSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: TaxDeductionDto,
    ) {
        return this.raService.getTaxDeductionSummary(user, id, dto);
    }

    @Post('/full-breakdown/paydown/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get full rental analysis full breakdown paydown page',
        'Computes full breakdown paydown and cumulative projections for 5, 10, and 15 years',
    )
    @ApiResponseDecorator(200, 'Full rental paydown computed successfully')
    @ApiResponseDecorator(400, 'Invalid summary input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getPaydownSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: TaxDeductionDto,
    ) {
        return this.raService.getPaydownSummary(user, id, dto);
    }

    @Post('/full-breakdown/appreciation/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get full rental analysis full breakdown appreciation page',
        'Computes full breakdown appreciation and cumulative projections for 5, 10, and 15 years',
    )
    @ApiResponseDecorator(200, 'Full rental appreciation computed successfully')
    @ApiResponseDecorator(400, 'Invalid summary input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getAppreciationSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AppreciationDto,
    ) {
        return this.raService.getAppreciationSummary(user, id, dto);
    }

    @Post('/full-breakdown/buy-hold/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get full rental analysis full breakdown hold projection page',
        'Computes full breakdown hold projection and cumulative projections for 5, 10, and 15 years',
    )
    @ApiResponseDecorator(200, 'Full rental hold projection computed successfully')
    @ApiResponseDecorator(400, 'Invalid summary input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getBuyHoldProjections(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: BuyHoldDto,
    ) {
        return this.raService.getBuyHoldProjections(user, id, dto);
    }

    @Post('/deal-grade/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get rental analysis deal grade',
        'Computes the full deal grade including underwriting score, 3 pillars (Return, Efficiency, Stability), ' +
            'strengths and weaknesses, key underwriting metrics, and maximum offer calculator',
    )
    @ApiResponseDecorator(200, 'Deal grade computed successfully')
    @ApiResponseDecorator(400, 'Invalid input data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getRentalDealGrade(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: DealGradeDto,
    ) {
        return this.raService.getRentalDealGrade(user, id, dto);
    }

    @Post('/deal-comparison')
    @ApiOperationDecorator(
        'Get deal comparison',
        'Compares up to 4 rental analyses side by side using each analysis persisted params, computing summary and financial metrics for each property',
    )
    @ApiResponseDecorator(200, 'Deal comparison computed successfully')
    @ApiResponseDecorator(400, 'Invalid analysis ids')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getDealComparison(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: DealComparisonDto,
    ) {
        return this.raService.getDealComparison(user, dto);
    }
}
