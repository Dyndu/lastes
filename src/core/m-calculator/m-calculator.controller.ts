import { Controller, Post, Body, UseGuards, Get, Patch } from '../../common';
import { MCalculatorService } from './services';
import {
    ApiOperationDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
} from '../../common/decorators';
import {
    AmortizationBreakdownDto,
    AmortizationQueryDto,
    CalculateDownPaymentDto,
    CalculateDownPaymentPercentageDto,
    CreateMCalculatorDto,
    UpdateMCalculatorDto,
} from './dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import type { CurrentUserInterface } from '../../interface';
import { Query } from '@nestjs/common';

@Controller('m-calculator')
export class MCalculatorController {
    constructor(private readonly service: MCalculatorService) {}

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Get('saved/breakdown')
    @ApiOperationDecorator(
        'Get breakdown from saved calculator',
        'Get breakdown from saved calculator',
    )
    @ApiResponseDecorator(200, 'Calculator breakdown retrieved successfully')
    async savedBreakdown(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getMCalculatorBreakdownFromSaved(user);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Get('saved/amortization-breakdown')
    @ApiOperationDecorator(
        'Get amortization breakdown from saved calculator',
        'Get amortization breakdown from saved calculator',
    )
    @ApiResponseDecorator(200, 'Calculator amortization breakdown retrieved successfully')
    async savedAmortizationBreakdown(
        @CurrentUser() user: CurrentUserInterface,
        @Query() query: AmortizationQueryDto,
    ) {
        return this.service.getAmortizationBreakdownFromSaved(user, query);
    }

    @Post('down-payment-amount')
    @ApiOperationDecorator(
        'Get calculator down payment amount',
        'Get calculator down payment amount',
    )
    @ApiResponseDecorator(200, 'Data calculated successfully')
    async calculateDownPayment(@Body() dto: CalculateDownPaymentDto) {
        return this.service.determineDownPaymentAmount(dto);
    }

    @Post('down-payment-percentage')
    @ApiOperationDecorator(
        'Get calculator down payment percentage',
        'Get calculator down payment percentage',
    )
    @ApiResponseDecorator(200, 'Data calculated successfully')
    async calculateDownPaymentPercentage(@Body() dto: CalculateDownPaymentPercentageDto) {
        return this.service.determineDownPaymentPercentage(dto);
    }

    @Post('loan-amount')
    @ApiOperationDecorator('Get calculator loan amount', 'Get calculator loan amount')
    @ApiResponseDecorator(200, 'Data calculated successfully')
    async calculateLoanAmount(@Body() dto: CalculateDownPaymentPercentageDto) {
        return this.service.determineLoanAmount(dto);
    }

    @Post('breakdown')
    @ApiOperationDecorator('Get calculator full breakdown', 'Get calculator full breakdown')
    @ApiResponseDecorator(200, 'Calculator breakdown retrieved successfully')
    async calculateBreakdown(@Body() dto: CreateMCalculatorDto) {
        return this.service.getMCalculatorBreakdown(dto);
    }

    @Post('amortization-breakdown')
    @ApiOperationDecorator(
        'Get calculator amortization full breakdown',
        'Get calculator amortization full breakdown',
    )
    @ApiResponseDecorator(200, 'Calculator breakdown retrieved successfully')
    async amortizationBreakdown(@Body() dto: AmortizationBreakdownDto) {
        return this.service.calculatorAmortizationScheduleBreakdown(dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Get('details')
    @ApiOperationDecorator('Get calculator full details', 'Get calculator full details')
    @ApiResponseDecorator(200, 'Calculator details retrieved successfully')
    async calculatorDetails(@CurrentUser() user: CurrentUserInterface) {
        return this.service.mCalculatorDetails(user);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Post('create')
    @ApiOperationDecorator('Create calculator', 'Create calculator')
    @ApiResponseDecorator(201, 'Calculator created successfully')
    async createCalculator(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateMCalculatorDto,
    ) {
        return this.service.createMCalculator(user, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Patch('update')
    @ApiOperationDecorator('Update calculator', 'Update calculator')
    @ApiResponseDecorator(200, 'Calculator update successfully')
    async updateCalculator(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: UpdateMCalculatorDto,
    ) {
        return this.service.updateMCalculator(user, dto);
    }
}
