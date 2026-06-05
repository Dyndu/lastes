import { Controller, Delete, Get, Param, ParseUUIDPipe, UseGuards } from '../../common';
import { DtiCalculatorService } from './services';
import {
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
} from '../../common/decorators';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard, SubscriptionGuard } from '../../common/guard';
import { Body, Patch, Post } from '@nestjs/common';
import type { CurrentUserInterface } from '../../interface';
import {
    CreateDtiCardDto,
    CreateDtiEmploymentIncomeDto,
    CreateDtiOtherDebtDto,
    CreateDtiOtherIncomeDto,
    CreateDtiPropertyDto,
    UpdateDtiCardDto,
    UpdateDtiEmploymentIncomeDto,
    UpdateDtiOtherDebtDto,
    UpdateDtiOtherIncomeDto,
    UpdateDtiPropertyDto,
} from './dto';
import { FieldDto } from '../../common/dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@Controller('dti-calculator')
export class DtiCalculatorController {
    constructor(private readonly service: DtiCalculatorService) {}

    @NonAdminOnly()
    @Get('breakdown')
    @ApiOperationDecorator(
        'Get calculator breakdown summary',
        'Retrieve calculator breakdown summary',
    )
    @ApiResponseDecorator(200, 'Date retrieved successfully')
    async calculatorSummary(@CurrentUser() user: CurrentUserInterface) {
        return this.service.calculatorSummary(user);
    }

    @NonAdminOnly()
    @Get('details')
    @ApiOperationDecorator('Get calculator details', 'Retrieve calculator details')
    @ApiResponseDecorator(200, 'Date retrieved successfully')
    async calculatorDetails(@CurrentUser() user: CurrentUserInterface) {
        return this.service.calculatorDetails(user);
    }

    @NonAdminOnly()
    @Get('income')
    @ApiOperationDecorator(
        'Get properties income',
        'Retrieve properties income and calculate the total income',
    )
    @ApiResponseDecorator(200, 'Date retrieved successfully')
    async propertiesIncome(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getDtiPropertiesIncome(user);
    }

    @NonAdminOnly()
    @Get('mortgages')
    @ApiOperationDecorator(
        'Get properties mortgages',
        'Retrieve properties mortgages and calculate the total mortgages',
    )
    @ApiResponseDecorator(200, 'Data retrieved successfully')
    async propertiesMortgages(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getDtiPropertiesMortgages(user);
    }

    @NonAdminOnly()
    @Get('e-income')
    @ApiOperationDecorator(
        'Get employment income',
        'Retrieve employment income and calculate the total employment amount',
    )
    @ApiResponseDecorator(200, 'Data retrieved successfully')
    async dtiEIncome(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getDtiEIncome(user);
    }

    @NonAdminOnly()
    @Get('o-income')
    @ApiOperationDecorator(
        'Get other income',
        'Retrieve other income and calculate the total other income amount',
    )
    @ApiResponseDecorator(200, 'Data retrieved successfully')
    async dtiOIncome(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getDtiOIncome(user);
    }

    @NonAdminOnly()
    @Get('cards')
    @ApiOperationDecorator(
        'Get calculator cards',
        'Retrieve calculator cards and calculate the total cards amount',
    )
    @ApiResponseDecorator(200, 'Data retrieved successfully')
    async dtiCards(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getDtiCards(user);
    }

    @NonAdminOnly()
    @Get('o-debts')
    @ApiOperationDecorator(
        'Get calculator other debts',
        'Retrieve calculator other debts and calculate the total debts amount',
    )
    @ApiResponseDecorator(200, 'Data retrieved successfully')
    async dtiOtherDebts(@CurrentUser() user: CurrentUserInterface) {
        return this.service.getDtiODebts(user);
    }

    @NonAdminOnly()
    @Get('g-month')
    @ApiOperationDecorator('Get calculator grossly month', 'Retrieve calculator grossly month')
    @ApiResponseDecorator(200, 'Data retrieved successfully')
    async dtiGrosslyMonth(@CurrentUser() user: CurrentUserInterface) {
        return this.service.grosslyMonth(user);
    }

    @NonAdminOnly()
    @Patch('details')
    @ApiOperationDecorator('Update calculator description', 'Update calculator description')
    @ApiResponseDecorator(200, 'Calculator updated successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Calculator not found')
    async updateCalculator(@CurrentUser() user: CurrentUserInterface, @Body() updateDto: FieldDto) {
        return this.service.updateCalculator(user, updateDto.field);
    }

    @NonAdminOnly()
    @Post('properties')
    @ApiOperationDecorator('Create a property', 'Create a dti property')
    @ApiResponseDecorator(200, 'Property created successfully.')
    @ApiResponseDecorator(404, 'Calculator not found')
    async createDtiProperty(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateDtiPropertyDto,
    ) {
        return this.service.createPropertyDetails(user, dto);
    }

    @NonAdminOnly()
    @Patch('properties/:id')
    @ApiParamDecorator('id of the property')
    @ApiOperationDecorator('Update property', 'Update dti property')
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Calculator not found')
    async updateDtiProperty(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDtiPropertyDto,
    ) {
        return this.service.updateDtiPropertyDetails(id, updateDto);
    }

    @NonAdminOnly()
    @Delete('properties/:id')
    @ApiParamDecorator('id of the property')
    @ApiOperationDecorator('Delete module', 'Activate or deactivate module')
    @ApiResponseDecorator(200, 'Module updated successfully')
    @ApiResponseDecorator(404, 'Module not found')
    async deleteDtiProperty(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.deleteDtiPropertyDetails(id);
    }

    @NonAdminOnly()
    @Post('e-income')
    @ApiOperationDecorator('Create a employment income', 'Create a dti employment income')
    @ApiResponseDecorator(200, 'Property created successfully.')
    @ApiResponseDecorator(404, 'Calculator not found')
    async createDtiEIncome(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateDtiEmploymentIncomeDto,
    ) {
        return this.service.addEmploymentIncome(user, dto);
    }

    @NonAdminOnly()
    @Patch('e-income/:id')
    @ApiParamDecorator('id of the employment income')
    @ApiOperationDecorator('Update employment income', 'Update dti employment income')
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Calculator not found')
    async updateDtiEIncome(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDtiEmploymentIncomeDto,
    ) {
        return this.service.updateEmploymentIncome(id, updateDto);
    }

    @NonAdminOnly()
    @Delete('e-income/:id')
    @ApiParamDecorator('id of the employment income')
    @ApiOperationDecorator('Delete employment income', 'Delete employment income')
    @ApiResponseDecorator(200, 'Employment income deleted successfully')
    @ApiResponseDecorator(404, 'Employment income not found')
    async deleteDtiEIncome(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.deleteEmploymentIncome(id);
    }

    @NonAdminOnly()
    @Post('o-income')
    @ApiOperationDecorator('Create a other income', 'Create a dti other income')
    @ApiResponseDecorator(200, 'Property created successfully.')
    @ApiResponseDecorator(404, 'Calculator not found')
    async createDtiOIncome(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateDtiOtherIncomeDto,
    ) {
        return this.service.addOtherIncome(user, dto);
    }

    @NonAdminOnly()
    @Patch('o-income/:id')
    @ApiParamDecorator('id of the other income')
    @ApiOperationDecorator('Update other income', 'Update dti other income')
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Calculator not found')
    async updateDtiOIncome(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDtiOtherIncomeDto,
    ) {
        return this.service.updateOtherIncome(id, updateDto);
    }

    @NonAdminOnly()
    @Delete('o-income/:id')
    @ApiParamDecorator('id of the other income')
    @ApiOperationDecorator('Delete other income', 'Delete other income')
    @ApiResponseDecorator(200, 'Data deleted successfully')
    @ApiResponseDecorator(404, 'Data not found')
    async deleteDtiOIncome(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.deleteOtherIncome(id);
    }

    @NonAdminOnly()
    @Post('o-debt')
    @ApiOperationDecorator('Create a other debt', 'Create a dti other debt')
    @ApiResponseDecorator(200, 'Property created successfully.')
    @ApiResponseDecorator(404, 'Calculator not found')
    async createDtiODebts(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateDtiOtherDebtDto,
    ) {
        return this.service.addOtherDebt(user, dto);
    }

    @NonAdminOnly()
    @Patch('o-debt/:id')
    @ApiParamDecorator('id of the other debt')
    @ApiOperationDecorator('Update other debt', 'Update dti other debt')
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Calculator not found')
    async updateDtiODebts(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDtiOtherDebtDto,
    ) {
        return this.service.updateOtherDebt(id, updateDto);
    }

    @NonAdminOnly()
    @Delete('o-debt/:id')
    @ApiParamDecorator('id of the other debt')
    @ApiOperationDecorator('Delete other debt', 'Delete other debt')
    @ApiResponseDecorator(200, 'Data deleted successfully')
    @ApiResponseDecorator(404, 'Data not found')
    async deleteDtiODebts(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.deleteOtherDebt(id);
    }

    @NonAdminOnly()
    @Post('card')
    @ApiOperationDecorator('Create a other debt', 'Create a dti other debt')
    @ApiResponseDecorator(200, 'Property created successfully.')
    @ApiResponseDecorator(404, 'Calculator not found')
    async createCreditCard(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateDtiCardDto,
    ) {
        return this.service.createDtiCreditsCard(user, dto);
    }

    @NonAdminOnly()
    @Patch('card/:id')
    @ApiParamDecorator('id of the credit card')
    @ApiOperationDecorator('Update credit card', 'Update dti credit card')
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Calculator not found')
    async updateCreditCard(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateDtiCardDto,
    ) {
        return this.service.updateDtiCreditCard(id, updateDto);
    }

    @NonAdminOnly()
    @Delete('card/:id')
    @ApiParamDecorator('id of the credit card')
    @ApiOperationDecorator('Delete credit card', 'Delete credit card')
    @ApiResponseDecorator(200, 'Data deleted successfully')
    @ApiResponseDecorator(404, 'Data not found')
    async deleteCreditCard(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.deleteDtiCreditCard(id);
    }
}
