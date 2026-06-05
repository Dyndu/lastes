import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '../../common';
import { AdsStatusEnum } from '../../common/enum';
import {
    AdminViewDecorator,
    PaginationQueryDecorator,
    Permissions,
    ApiResponseDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
} from '../../common/decorators';
import { AdsService } from './services';
import { CalendarAdsDto, CreateAdsDto, ReuseAdsDto, UpdateAdsDto } from './dto';
import { PaginationDto } from '../../common/dto';

@Controller('ads_spaces')
export class AdsController {
    constructor(private readonly adsService: AdsService) {}

    @AdminViewDecorator('ads_spaces')
    @Get('count')
    @ApiOperationDecorator('Count ads', 'Count ads stats')
    @ApiResponseDecorator(200, 'Ads count retrieve successfully')
    @ApiResponseDecorator(403, `Can't get ads counts`)
    async badgeCount() {
        return this.adsService.adsStats();
    }

    @Get('running/today')
    @ApiOperationDecorator(
        'Get running ads for today',
        'Retrieve all ads that are currently running today',
    )
    @ApiResponseDecorator(200, 'Running ads retrieved successfully')
    @ApiResponseDecorator(403, `Don't have permissions for ads`)
    async getTodayRunningAds() {
        return this.adsService.getRunningAdsForToday();
    }

    @AdminViewDecorator('ads_spaces')
    @Get('current-month')
    @ApiOperationDecorator(
        'Get current month ads',
        'Retrieve all ads scheduled for the current month',
    )
    @ApiResponseDecorator(200, 'Current month ads retrieved successfully')
    @ApiResponseDecorator(403, `Don't have permissions for ads`)
    async getCurrentMonthAds() {
        return this.adsService.getCurrentMonthAds();
    }

    @AdminViewDecorator('ads_spaces')
    @Get()
    @ApiOperationDecorator('Get all ads', 'Get all ads non deleted in the database')
    @ApiResponseDecorator(200, 'Ads retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions for ads`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        required: false,
        description: 'Filter ads by provided status',
        enum: AdsStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter ads by search term',
        type: 'string',
    })
    async nonDeletedAds(
        @Query() pagination: PaginationDto,
        @Query('status') status?: AdsStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.adsService.allAds(pagination.getPage(), pagination.getLimit(), {
            status,
            searchTerm: search,
        });
    }

    @AdminViewDecorator('ads_spaces')
    @Get(':id')
    @ApiParamDecorator('Ads_spaces')
    @ApiOperationDecorator(
        'Get an ads by its id',
        'Get ads by its id and transform data to the ui view',
    )
    @ApiResponseDecorator(200, 'Ads details')
    @ApiResponseDecorator(403, `Don't have permissions for ads details`)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.adsService.adsDetails(id);
    }

    @AdminViewDecorator('ads_spaces')
    @Get('calendar/:date')
    @ApiParamDecorator('Ads_spaces', 'date', '2026-12-01T00:00:00.000Z')
    @ApiOperationDecorator(
        'Scheduled ads on the provided date',
        'Retrieve ads when duration is in provided date month and year',
    )
    @ApiResponseDecorator(200, 'Calendar data retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions to retrieve ads calendar`)
    async calendar(@Param() params: CalendarAdsDto) {
        return this.adsService.retrieveAdsGroupedByType(params.date);
    }

    @AdminViewDecorator('ads_spaces')
    @Permissions({ ui: 'ads_spaces', actions: ['create'] })
    @Post()
    @ApiOperationDecorator('Create a new add', 'Create a new ads with the provided dto data')
    @ApiResponseDecorator(201, 'Create an ads')
    @ApiResponseDecorator(400, 'Failed validation from create ads dto')
    @ApiResponseDecorator(403, `Can't create ads. Access denied`)
    @ApiResponseDecorator(404, 'Some ads related entities not found')
    async createA(@Body() dto: CreateAdsDto) {
        return this.adsService.createAds(dto);
    }

    @AdminViewDecorator('ads_spaces')
    @Permissions({ ui: 'ads_spaces', actions: ['update'] })
    @Patch('/update/:id')
    @ApiParamDecorator('Ads_spaces')
    @ApiOperationDecorator('Update an existing ads', 'Update a new ads with the provided dto data')
    @ApiResponseDecorator(200, 'Update an existing ads')
    @ApiResponseDecorator(400, 'Failed validation from update ads dto')
    @ApiResponseDecorator(403, `Can't update ads. Access denied`)
    @ApiResponseDecorator(404, 'Some ads related entities or ads not found')
    async updateA(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateAdsDto) {
        return this.adsService.updateAds(id, updateDto);
    }

    @AdminViewDecorator('ads_spaces')
    @Permissions({ ui: 'ads_spaces', actions: ['update'] })
    @Patch('/reuse/:id')
    @ApiParamDecorator('Ads_spaces')
    @ApiOperationDecorator(
        'Rescheduled an ads',
        'Reschedule an expired ads to a new future duration',
    )
    @ApiResponseDecorator(200, 'Set a new duration for an expired ad')
    @ApiResponseDecorator(400, 'Failed validation from reuse add dto')
    @ApiResponseDecorator(403, `Can't reuse expired ads. Access denied`)
    @ApiResponseDecorator(404, 'Ads or some entities not found')
    async reusedA(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: ReuseAdsDto) {
        return this.adsService.reuseExpiredAd(id, updateDto);
    }

    @AdminViewDecorator('ads_spaces')
    @Permissions({ ui: 'ads_spaces', actions: ['update'] })
    @Patch('/toggle/:id')
    @ApiParamDecorator('Ads_spaces')
    @ApiOperationDecorator('Toggle activeness of an ads', 'Ads activated or deactivated')
    @ApiResponseDecorator(200, 'Ads update successfully')
    @ApiResponseDecorator(400, 'Failed validation for uuid')
    @ApiResponseDecorator(403, `Forbidden, doesn't have the right access`)
    @ApiResponseDecorator(404, 'Ads not found')
    async toggleAD(@Param('id', ParseUUIDPipe) id: string) {
        return this.adsService.toggleAds(id);
    }
}
