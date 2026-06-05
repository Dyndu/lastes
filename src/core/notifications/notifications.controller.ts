import {
    ApiBearerAuth,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    UseGuards,
} from '../../common';
import { JwtAuthGuard } from '../../common/guard';
import {
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    CurrentUser,
    PaginationQueryDecorator,
} from '../../common/decorators';
import { NotificationsService } from './services';
import type { CurrentUserInterface } from '../../interface';
import { PaginationDto, UuidsArrayDto } from '../../common/dto';
import { Patch } from '@nestjs/common';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly nsService: NotificationsService) {}

    @Get('badge-count')
    @ApiOperationDecorator('User notification count', 'Count user new notifications')
    @ApiResponseDecorator(200, 'User notification count')
    @ApiResponseDecorator(401, 'User not connected')
    async badgeCount(@CurrentUser() user: CurrentUserInterface) {
        return this.nsService.nUsersService.userUnreadNs(user.id);
    }

    @Get()
    @ApiOperationDecorator(
        'All user notification',
        'Retrieve user notifications and transform to ui view',
    )
    @ApiResponseDecorator(200, 'User notifications retrieved successfully')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'isNew',
        required: false,
        description: 'Filter nw notifications only',
        type: 'boolean',
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter notifications by key word',
        type: 'string',
    })
    async allNotifications(
        @CurrentUser() user: CurrentUserInterface,
        @Query() pagination: PaginationDto,
        @Query('isNew') isNew?: boolean,
        @Query('search') search?: string,
    ) {
        return this.nsService.retrieveUserNotifications(
            pagination.getPage(),
            pagination.getLimit(),
            user.id,
            {
                isNew,
                searchTerm: search,
            },
        );
    }

    @Get(':id')
    @ApiParamDecorator('notification')
    @ApiOperationDecorator(
        'Get a notification by id',
        'Get a notification by id and transform result to ui view',
    )
    @ApiResponseDecorator(200, 'Notification details retrieve successfully')
    @ApiResponseDecorator(404, 'Notification not found')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.nsService.nDetails(id);
    }

    @Patch('mark-as-read')
    @ApiOperationDecorator('Mark notifications as read', 'Mark user unread notification as read')
    @ApiResponseDecorator(200, 'Notification read successfully')
    async markAsRead(@CurrentUser() user: CurrentUserInterface, @Body() ids: UuidsArrayDto) {
        return this.nsService.nUsersService.markNAsRead(user.id, ids.ids);
    }

    @Delete('clear-some')
    @ApiOperationDecorator('Clear user notification', 'Delete some specified notifications')
    @ApiResponseDecorator(200, 'Notifications deleted successfully')
    @ApiResponseDecorator(404, 'Notifications not found')
    async delete(@CurrentUser() user: CurrentUserInterface, @Body() ids: UuidsArrayDto) {
        return this.nsService.clearNotifs(user.id, ids.ids);
    }

    @Delete('clear-all')
    @ApiOperationDecorator('Clear notifications', 'Delete all user notifications')
    @ApiResponseDecorator(200, 'Notifications deleted successfully')
    async deleteAll(@CurrentUser() user: CurrentUserInterface) {
        return this.nsService.clearAllNotifs(user.id);
    }
}
