import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Delete } from '../../common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiResponseDecorator,
    Permissions,
} from '../../common/decorators';

@AdminViewDecorator('admin_users')
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {}

    @Get()
    @ApiOperationDecorator(
        'Retrieve groups',
        'Get all non deleted groups with required permissions',
    )
    @ApiResponseDecorator(200, 'Groups retrieve successfully')
    @ApiResponseDecorator(403, `Forbidden, access denied`)
    async allGroups() {
        return this.groupsService.findAllGroup();
    }

    @Get(':id')
    @ApiParamDecorator('group')
    @ApiOperationDecorator(
        'Get a group details',
        'Retrieve a group with provided parameter and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Group details retrieve successfully')
    @ApiResponseDecorator(403, 'Forbidden, group access denied')
    @ApiResponseDecorator(404, 'Group not found')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.groupsService.findOne(id);
    }

    @Permissions({ ui: 'admin_users', actions: ['create'] })
    @Post()
    @ApiOperationDecorator(
        'Create a new group',
        'Create a new group with provided data in dto after validation',
    )
    @ApiResponseDecorator(201, 'Group created successfully')
    @ApiResponseDecorator(400, 'Failed validations from group creation dto')
    @ApiResponseDecorator(403, 'Forbidden, access denied for group creation')
    @ApiResponseDecorator(404, 'Some group related entities not found')
    async createG(@Body() dto: CreateGroupDto) {
        return this.groupsService.createPermissionGroup(dto);
    }

    @Permissions({ ui: 'admin_users', actions: ['update'] })
    @Patch(':id')
    @ApiParamDecorator('group')
    @ApiOperationDecorator(
        'Update an existing group',
        'Update an existing group with provided data in dto after validation',
    )
    @ApiResponseDecorator(200, 'Group updated successfully')
    @ApiResponseDecorator(400, 'Failed validations from group update dto')
    @ApiResponseDecorator(403, 'Forbidden, access denied for group update')
    @ApiResponseDecorator(404, 'Group or some group related entities not found')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateGroupDto: UpdateGroupDto) {
        return this.groupsService.updateGroupPerm(id, updateGroupDto);
    }

    @Permissions({ ui: 'admin_users', actions: ['delete'] })
    @Delete(':id')
    @ApiParamDecorator('group')
    @ApiOperationDecorator('Delete an existing group', 'Delete an existing group')
    @ApiResponseDecorator(200, 'Group deleted successfully')
    @ApiResponseDecorator(400, 'Failed validations from group uuid dto')
    @ApiResponseDecorator(403, 'Forbidden, access denied for group delete')
    @ApiResponseDecorator(404, 'Group entities not found')
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.groupsService.deleteGroup(id);
    }
}
