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
import { CFinancingService } from './services';
import { CFinancingCalculatorDto } from './dto';
import { CreateRaBuilderDto } from '../r-analysis/dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('c-financing')
export class CFinancingController {
    constructor(private readonly cFinancingService: CFinancingService) {}

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getCFinancingAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.cFinancingService.getCFinancingAnalysisBuilder(user, id);
    }

    @Post('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Upsert creative financing builder',
        'Create or update creative financing builder for a creative financing analysis',
    )
    @ApiResponseDecorator(201, 'Property details upserted successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveCFinancingBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateRaBuilderDto,
    ) {
        return this.cFinancingService.resolveCFinancingBuilder(user, id, dto);
    }

    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Generate creative financing analysis resume',
        'Generate creative financing analysis resume',
    )
    @ApiResponseDecorator(400, 'Invalid fixed expenses data')
    @Post('calculator')
    compute(@Body() dto: CFinancingCalculatorDto) {
        return this.cFinancingService.generateResume(dto);
    }
}
