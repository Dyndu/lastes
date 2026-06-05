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
import { FFlipService } from './services';
import { CreateFFlipBuilderDto } from './dto/create-f-flip-builder.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('fix-flip')
export class FFlipController {
    constructor(private readonly fFlipService: FFlipService) {}

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getFFlipAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.fFlipService.getFFlipAnalysisBuilder(user, id);
    }

    @Get('/summary-breakdown/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator('Get summary details', 'Get the full summary breakdown of the builder')
    @ApiResponseDecorator(200, 'Summary retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getFFlipSummaryBreakdown(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.fFlipService.getFFlipSummary(user, id);
    }

    @Post('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Upsert property details',
        'Create or update property details for a fix and flip analysis',
    )
    @ApiResponseDecorator(201, 'Property details upserted successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveFFlipBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateFFlipBuilderDto,
    ) {
        return this.fFlipService.resolveFFlipBuilder(user, id, dto);
    }
}
