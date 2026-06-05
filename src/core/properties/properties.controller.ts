import {
    ApiBearerAuth,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    UseGuards,
} from '../../common';
import {
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
    PaginationQueryDecorator,
} from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import type { CurrentUserInterface } from '../../interface';
import { PropertiesService } from './services';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('properties')
export class PropertiesController {
    constructor(private readonly pService: PropertiesService) {}

    @NonAdminOnly()
    @Get('user')
    @ApiOperationDecorator('Get user properties', 'Retrieve only properties created by user')
    @ApiResponseDecorator(200, 'Properties retrieved successfully')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter properties by provided key word',
        type: 'string',
    })
    async userProperties(
        @CurrentUser() user: CurrentUserInterface,
        @Query() pagination: PaginationDto,
        @Query('search') search?: string,
    ) {
        return this.pService.getUserProperties(
            user.id,
            pagination.getPage(),
            pagination.getLimit(),
            search,
        );
    }

    @Get('details-app/:id')
    @ApiParamDecorator('property')
    @ApiOperationDecorator(
        'Update an existing property',
        'Update an existing property from provided data in dto',
    )
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(403, 'Access denied for property update')
    @ApiResponseDecorator(404, 'Some related property entities not found')
    async detailsApp(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.pService.getPropertyDetails(user, id);
    }

    @Get('details/:id')
    @ApiParamDecorator('property')
    @ApiOperationDecorator(
        'Update an existing property',
        'Update an existing property from provided data in dto',
    )
    @ApiResponseDecorator(200, 'Property updated successfully')
    @ApiResponseDecorator(403, 'Access denied for property update')
    @ApiResponseDecorator(404, 'Some related property entities not found')
    async details(@Param('id', ParseUUIDPipe) id: string) {
        return this.pService.rentCastService.getProperty(id);
    }
}
