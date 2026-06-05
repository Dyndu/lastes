import {
    ApiBearerAuth,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '../../common';
import { GuideStatusEnum } from '../../common/enum';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
    PaginationQueryDecorator,
    Permissions,
} from '../../common/decorators';
import { CreateGuideDto, UpdateGuideDto, ReactGuideDto } from './dto';
import { GuidesService } from './services';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import type { CurrentUserInterface } from '../../interface';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('guides')
export class GuidesController {
    constructor(private readonly guidesService: GuidesService) {}

    @AdminViewDecorator('guides')
    @Get('badge-count')
    @ApiOperationDecorator('Guides badge count', 'Count guides based on status')
    @ApiResponseDecorator(200, 'Guides badge count retrieve successfully')
    @ApiResponseDecorator(403, 'Access denied for guides badge count retrieval')
    async badgeCount() {
        return this.guidesService.guideStats();
    }

    @NonAdminOnly()
    @Get('published')
    @ApiOperationDecorator(
        'Get published guides',
        'Retrieve only published guides and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Published guides retrieve successfully')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter guides by provided key word',
        type: 'string',
    })
    @ApiQueryDecorator({
        name: 'isVideo',
        required: false,
        description: 'Filter guides by either video or not',
        type: 'boolean',
    })
    @ApiQueryDecorator({
        name: 'categories',
        required: false,
        description: 'Filter guides by category ids',
        type: 'string',
        isArray: true,
    })
    async publishedGuides(
        @CurrentUser() user: CurrentUserInterface,
        @Query() pagination: PaginationDto,
        @Query('search') search?: string,
        @Query('isVideo') isVideo?: boolean,
        @Query('liked') liked?: boolean,
    ) {
        return this.guidesService.userGuides(user, pagination.getPage(), pagination.getLimit(), {
            liked,
            searchTerm: search,
            isVideo,
        });
    }

    @AdminViewDecorator('guides')
    @Get()
    @ApiOperationDecorator('Get all guides', 'Retrieve all guides and transform to ui view')
    @ApiResponseDecorator(200, 'Guides retrieved successfully')
    @ApiResponseDecorator(403, 'Access denied for all guides retrieval')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        required: false,
        description: 'Filter guides by status',
        enum: GuideStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter guides by provided key word',
        type: 'string',
    })
    async allGuides(
        @Query() pagination: PaginationDto,
        @Query('status') status?: GuideStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.guidesService.allGuides(pagination.getPage(), pagination.getLimit(), {
            status,
            searchTerm: search,
        });
    }

    @NonAdminOnly()
    @Get('user/:id')
    @ApiParamDecorator('guides')
    @ApiOperationDecorator(
        'Guide details',
        'Retrieve details of guide by users only and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Guide details retrieve successfully')
    @ApiResponseDecorator(404, 'Guide not found')
    async findUserGuideDetail(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.guidesService.userGuideDetails(user, id);
    }

    @AdminViewDecorator('guides')
    @Get(':id')
    @ApiParamDecorator('guides')
    @ApiOperationDecorator('Guide details', 'Retrieve details of guide and transform to ui view')
    @ApiResponseDecorator(200, 'Guide details retrieve successfully')
    @ApiResponseDecorator(404, 'Guide not found')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.guidesService.guideDetails(id);
    }

    @AdminViewDecorator('guides')
    @Permissions({ ui: 'guides', actions: ['create'] })
    @Post()
    @ApiOperationDecorator('Create a new guide', 'Create a new guide from provided data in dto')
    @ApiResponseDecorator(201, 'Guide created successfully')
    @ApiResponseDecorator(403, 'Access denied for guide creation')
    @ApiResponseDecorator(404, 'Some related guide entities not found')
    async createG(@Body() dto: CreateGuideDto) {
        return this.guidesService.createGuide(dto);
    }

    @AdminViewDecorator('guides')
    @Permissions({ ui: 'guides', actions: ['update'] })
    @Patch(':id')
    @ApiParamDecorator('guides')
    @ApiOperationDecorator(
        'Update an existing guide',
        'Update an existing guide from provided data in dto',
    )
    @ApiResponseDecorator(200, 'Guide updated successfully')
    @ApiResponseDecorator(403, 'Access denied for guide update')
    @ApiResponseDecorator(404, 'Some related guide entities not found')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateGuideDto) {
        return this.guidesService.updateGuide(id, updateDto);
    }

    @NonAdminOnly()
    @Post('react/:id')
    @ApiParamDecorator('guides')
    @ApiOperationDecorator('React to a guide', 'React to a guide by user')
    @ApiResponseDecorator(201, 'Reaction created successfully')
    @ApiResponseDecorator(403, 'Access denied for guide reaction')
    @ApiResponseDecorator(404, 'Some related guide entities not found')
    async reactToGuide(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() reactGuideDto: ReactGuideDto,
    ) {
        return this.guidesService.reactToGuide(user, id, reactGuideDto);
    }

    @AdminViewDecorator('guides')
    @Permissions({ ui: 'guides', actions: ['delete'] })
    @Delete(':id')
    @ApiParamDecorator('guides')
    @ApiOperationDecorator(
        'Delete an existing guide',
        'Delete an existing guide from provided id in param',
    )
    @ApiResponseDecorator(200, 'Guide deleted successfully')
    @ApiResponseDecorator(403, 'Access denied for guide delete')
    @ApiResponseDecorator(404, 'Guide entities not found')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.guidesService.deleteGuide(id);
    }
}
