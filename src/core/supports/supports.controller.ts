import { ApiBearerAuth, Controller, Get, Query, UseGuards } from '../../common';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
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
import { SupportsService } from './services';
import type { CurrentUserInterface } from '../../interface';
import { PaginationDto } from '../../common/dto';
import { SConStatusEnum } from '../../common/enum';
import { Body, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { AdminSendMessageDto, CreateConDto } from './dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supports')
export class SupportsController {
    constructor(private readonly supportService: SupportsService) {}

    @Get('/cons/badge-count')
    @ApiOperationDecorator('Count conversations', 'Counts data based on chat stats')
    @ApiResponseDecorator(200, 'Chats count retrieved successfully')
    async badgeCount(@CurrentUser() user: CurrentUserInterface) {
        return this.supportService.badgeCount(user);
    }

    @NonAdminOnly()
    @Get('/cons/user')
    @ApiOperationDecorator(
        'All user conversations',
        'Retrieve user conversations and transform to ui view',
    )
    @ApiResponseDecorator(200, 'User conversations retrieved successfully')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        required: false,
        description: 'Filter user conversations by status',
        enum: SConStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter conversations by key word',
        type: 'string',
    })
    async allUserConversations(
        @CurrentUser() user: CurrentUserInterface,
        @Query() pagination: PaginationDto,
        @Query('status') status?: SConStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.supportService.userConList(
            user,
            pagination.getPage(),
            pagination.getLimit(),
            status,
            search,
        );
    }

    @NonAdminOnly()
    @Get('/cons/user/open-chat/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Open a conversation', 'Open a conversation messages by user')
    @ApiResponseDecorator(200, 'Message retrieves successfully')
    @ApiQueryDecorator({
        name: 'limit',
        required: true,
        description:
            'Limit the number of message to retrieve before the last message of the conversation',
        type: 'number',
    })
    async openCByUser(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('limit') limit: number,
    ) {
        return this.supportService.openConMessagesByUser(user, id, limit);
    }

    @Get('/cons/scroll-chat/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Scroll in a conversation', 'Scroll in a conversation messages by user')
    @ApiResponseDecorator(200, 'Message retrieves successfully')
    @ApiQueryDecorator({
        name: 'cursorId',
        required: true,
        description: 'Id of the message from where to retrieve message from',
        type: 'string',
    })
    @ApiQueryDecorator({
        name: 'limit',
        required: true,
        description:
            'Limit the number of message to retrieve before the last message of the conversation',
        type: 'number',
    })
    @ApiQueryDecorator({
        name: 'direction',
        required: true,
        description: 'Direct how the scroll has to go',
        enum: ['before', 'after'],
    })
    async scrollCMessages(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('limit') limit: number,
        @Query('cursorId', ParseUUIDPipe) cursorId: string,
        @Query('direction') direction: 'before' | 'after' = 'before',
    ) {
        return this.supportService.scrollMessage(id, cursorId, limit, direction);
    }

    @AdminViewDecorator('help_support')
    @Get('/cons/admin/open-chat/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Open a conversation', 'Open a conversation messages by admin')
    @ApiResponseDecorator(200, 'Message retrieves successfully')
    @ApiQueryDecorator({
        name: 'limit',
        required: true,
        description:
            'Limit the number of message to retrieve before the last message of the conversation',
        type: 'number',
    })
    async openCByAdmin(
        @CurrentUser() admin: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('limit') limit: number,
    ) {
        return this.supportService.openConMessagesByAdmin(admin, id, limit);
    }

    @AdminViewDecorator('help_support')
    @Get('/cons/admin')
    @ApiOperationDecorator(
        'All supports conversations',
        'Retrieve supports conversations and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Conversations retrieved successfully')
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        required: false,
        description: 'Filter conversations by status',
        enum: SConStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter conversations by key word',
        type: 'string',
    })
    async allConversations(
        @CurrentUser() user: CurrentUserInterface,
        @Query() pagination: PaginationDto,
        @Query('status') status?: SConStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.supportService.adminConList(
            user,
            pagination.getPage(),
            pagination.getLimit(),
            status,
            search,
        );
    }

    @Get('/cons/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Con details', 'Retrieve supports conversation')
    @ApiResponseDecorator(200, 'Conversation retrieved successfully')
    @ApiResponseDecorator(404, 'Conversation not found')
    async conDetails(@Param('id', ParseUUIDPipe) id: string) {
        return this.supportService.conDetails(id);
    }

    @NonAdminOnly()
    @Post('create-con')
    @ApiOperationDecorator(
        'Create a new conversation',
        'Create a new conversation by user and transform data to ui view',
    )
    @ApiResponseDecorator(201, 'Chat created successfully')
    @ApiResponseDecorator(400, 'Failed validation from validator')
    @ApiResponseDecorator(404, 'Some entities may not be found.')
    @ApiResponseDecorator(403, 'Forbidden, access denied.')
    async createConversation(@CurrentUser() user: CurrentUserInterface, @Body() dto: CreateConDto) {
        return this.supportService.createConversation(user, dto);
    }

    @NonAdminOnly()
    @Post('/by-user')
    @ApiOperationDecorator(
        'Send a new message',
        'Send a new message by user, in an existing chat or by creating a new one',
    )
    @ApiResponseDecorator(201, 'Message sent successfully')
    @ApiResponseDecorator(400, 'Failed validation from validator')
    @ApiResponseDecorator(404, 'Some entities may not be found.')
    @ApiResponseDecorator(403, 'Forbidden, access denied.')
    async sendMByUser(@CurrentUser() user: CurrentUserInterface, @Body() dto: AdminSendMessageDto) {
        return this.supportService.sendMessageByUser(user, dto);
    }

    @AdminViewDecorator('help_support')
    @Permissions({ ui: 'help_support', actions: ['update'] })
    @Post('/by-admin')
    @ApiOperationDecorator(
        'Send a new message',
        'Send a new message by user, in an existing chat or by creating a new one',
    )
    @ApiResponseDecorator(201, 'Message sent successfully')
    @ApiResponseDecorator(400, 'Failed validation from validator')
    @ApiResponseDecorator(404, 'Some entities may not be found.')
    @ApiResponseDecorator(403, 'Forbidden, access denied.')
    async sendMByAdmin(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: AdminSendMessageDto,
    ) {
        return this.supportService.sendMessageByAdmin(user, dto);
    }

    @NonAdminOnly()
    @Patch('mark-as-read/by-user/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Mark messages as read', 'Mark user conversations message as read')
    @ApiResponseDecorator(200, 'Message reads successfully')
    @ApiResponseDecorator(400, 'Failed validation from validator')
    @ApiResponseDecorator(404, 'Some entities may not be found.')
    @ApiResponseDecorator(403, 'Forbidden, access denied.')
    async markAsReadByUser(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.supportService.markAsReadByUser(user, id);
    }

    @AdminViewDecorator('help_support')
    @Permissions({ ui: 'help_support', actions: ['create'] })
    @Patch('mark-as-read/by-admin/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Mark messages as read', 'Mark admin conversations message as read')
    @ApiResponseDecorator(200, 'Message reads successfully')
    @ApiResponseDecorator(400, 'Failed validation from validator')
    @ApiResponseDecorator(404, 'Some entities may not be found.')
    @ApiResponseDecorator(403, 'Forbidden, access denied.')
    async markAsReadByAdmin(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.supportService.markAsReadyAdmin(user, id);
    }

    @AdminViewDecorator('help_support')
    @Permissions({ ui: 'help_support', actions: ['update'] })
    @Patch('close/:id')
    @ApiParamDecorator('Support conversation')
    @ApiOperationDecorator('Closed chat', 'Close an open chat by user')
    @ApiResponseDecorator(200, 'Chat closed successfully')
    @ApiResponseDecorator(400, 'Failed validation from validator')
    @ApiResponseDecorator(404, 'Chat not found.')
    @ApiResponseDecorator(403, 'Forbidden, access denied.')
    async closeChat(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.supportService.closeChat(user, id);
    }
}
