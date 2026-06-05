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
import { WholesaleService } from './services';
import { CreateWholesaleBuilderDto } from './dto/create-wholesale-builder.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('wholesale')
export class WholesaleController {
    constructor(private readonly wholesaleService: WholesaleService) {}

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getWholesaleAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.wholesaleService.getWholesaleAnalysisBuilder(user, id);
    }

    @Get('/summary/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get analysis builder summary details',
        'Get analysis builder summary details',
    )
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getWholesaleSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.wholesaleService.getWholesaleSummary(user, id);
    }

    @Post('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Upsert wholesale builder',
        'Create or update wholesale builder for a wholesale analysis',
    )
    @ApiResponseDecorator(201, 'Property details upserted successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveWholesaleBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateWholesaleBuilderDto,
    ) {
        return this.wholesaleService.resolveWholesaleBuilder(user, id, dto);
    }
}
