import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '../../common';
import {
    ApiResponseDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    CurrentUser,
    NonAdminOnly,
    ApiQueryDecorator,
} from '../../common/decorators';
import type { CurrentUserInterface } from '../../interface';
import { JwtAuthGuard, PermissionsGuard, SubscriptionGuard } from '../../common/guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RCalculatorService } from './services';
import { BAnalysisTypeEnum } from '../../common/enum';
import { AddSectionsToRoomDto } from './dto/add-sections-to-room.dto';
import { ResolveREItemDto } from '../b-analysis/dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard, SubscriptionGuard)
@NonAdminOnly()
@Controller('rehab-calculator')
export class RCalculatorController {
    constructor(private readonly rCService: RCalculatorService) {}

    @Get('/compute-total/:id')
    @ApiParamDecorator('expense')
    @ApiOperationDecorator(
        'Compute RE item total',
        'Compute the total of a room expense item based on calculation method',
    )
    @ApiResponseDecorator(200, 'Total computed successfully')
    @ApiResponseDecorator(400, 'Invalid data')
    @ApiResponseDecorator(403, 'Access denied')
    async computeREItemTotal(@Param('id', ParseUUIDPipe) id: string) {
        return this.rCService.getExpenseRowTotal(id);
    }

    @Post('/compute-section-total')
    @ApiParamDecorator('section')
    @ApiOperationDecorator(
        'Compute section total',
        'Compute the sum of all expense item totals in a section',
    )
    @ApiResponseDecorator(200, 'Section total computed successfully')
    @ApiResponseDecorator(400, 'Invalid data')
    @ApiResponseDecorator(403, 'Access denied')
    async computeRSectionTotal(@Param('id', ParseUUIDPipe) id: string) {
        return this.rCService.getSectionTotal(id);
    }

    @Get('/room-total/:id')
    @ApiParamDecorator('room')
    @ApiOperationDecorator('Get room total', 'Compute the total cost of all expenses in a room')
    @ApiResponseDecorator(200, 'Room total retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Room not found')
    async getRoomTotal(@Param('id', ParseUUIDPipe) id: string) {
        return this.rCService.getRoomTotal(id);
    }

    @Get('/a-builder/:id')
    @ApiParamDecorator('analysis')
    @ApiQueryDecorator({
        name: 'type',
        required: true,
        description: 'Analysis builder based on type',
        enum: BAnalysisTypeEnum,
    })
    @ApiOperationDecorator('Get analysis builder details', 'Get analysis builder details')
    @ApiResponseDecorator(200, 'Analysis builder retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getRCAnalysisBuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('type') type: BAnalysisTypeEnum,
    ) {
        return this.rCService.resolveBuilderForAnalysis(user, id, type);
    }

    @Get('/rooms/:id')
    @ApiParamDecorator('analysis')
    @ApiQueryDecorator({
        name: 'type',
        required: true,
        description: 'Analysis builder based on type',
        enum: BAnalysisTypeEnum,
    })
    @ApiOperationDecorator(
        'Get rooms of the analysis builder based on type',
        'Get rooms of the analysis builder based on type',
    )
    @ApiResponseDecorator(200, 'Rooms retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getABuilderRooms(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('type') type: BAnalysisTypeEnum,
    ) {
        return this.rCService.getRoomsByType(user, id, type);
    }

    @Get('/sections/:id')
    @ApiParamDecorator('room')
    @ApiOperationDecorator('Get sections', `Retrieve sections of room based on it's id`)
    @ApiResponseDecorator(200, 'Sections retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getSectionsOfRooms(@Param('id', ParseUUIDPipe) id: string) {
        return this.rCService.getRoomSections(id);
    }

    @Get('/records/:id')
    @ApiParamDecorator('sections')
    @ApiOperationDecorator('Get records of an section', 'Retrieve all row recorded of the section')
    @ApiResponseDecorator(200, 'Record retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async getSectionRecords(@Param('id', ParseUUIDPipe) id: string) {
        return this.rCService.getSectionRecords(id);
    }

    @Post('/add-room/:id')
    @ApiParamDecorator('analysis')
    @ApiQueryDecorator({
        name: 'type',
        required: true,
        description: 'Analysis builder based on type',
        enum: BAnalysisTypeEnum,
    })
    @ApiOperationDecorator('Add room', 'Add a new room to analysis builder based on type')
    @ApiResponseDecorator(201, 'Room added successfully')
    @ApiResponseDecorator(400, 'Invalid property details data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async addRoomToABuilder(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('type') type: BAnalysisTypeEnum,
    ) {
        return this.rCService.addRoomByType(user, id, type);
    }

    @Post('/add-sections-to-room/:id')
    @ApiParamDecorator('room')
    @ApiOperationDecorator('Add new sections', `Create new sections to room based on it's id`)
    @ApiResponseDecorator(201, 'Sections added successfully')
    @ApiResponseDecorator(400, 'Invalid sections data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async addSectionsToRoom(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AddSectionsToRoomDto,
    ) {
        return this.rCService.addSectionRoom(id, dto.labels);
    }

    @Post('/add-records/:id')
    @ApiParamDecorator('sections')
    @ApiOperationDecorator(
        'Add new records to section table',
        'Create new records or/and update existing ones for section',
    )
    @ApiResponseDecorator(201, 'Records upserted successfully')
    @ApiResponseDecorator(400, 'Invalid records data')
    @ApiResponseDecorator(403, 'Access denied')
    @ApiResponseDecorator(404, 'Analysis not found')
    async resolveSectionRecords(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ResolveREItemDto,
    ) {
        return this.rCService.addRecordToSection(id, dto);
    }

    @Get('/summary/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get rehab calculator summary',
        'Returns a full summary of the rehab calculator including categories, sections, expenses, and total project cost.',
    )
    @ApiResponseDecorator(200, 'Summary retrieved successfully')
    @ApiResponseDecorator(400, 'Invalid request data')
    @ApiResponseDecorator(403, 'Access denied')
    async getRCSummary(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.rCService.getRCSummary(user, id);
    }

    @Get('/punch-list/:id')
    @ApiParamDecorator('analysis')
    @ApiOperationDecorator(
        'Get rehab calculator punch list',
        'Returns a full punch list of the rehab calculator including categories, sections, expenses, and total project cost.',
    )
    @ApiResponseDecorator(200, 'Summary retrieved successfully')
    @ApiResponseDecorator(400, 'Invalid request data')
    @ApiResponseDecorator(403, 'Access denied')
    async punchList(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.rCService.getRCPunchList(user, id);
    }
}
