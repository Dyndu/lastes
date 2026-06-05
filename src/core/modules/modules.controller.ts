import {
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    UseGuards,
    Post,
    Body,
    Patch,
} from '../../common';
import { ModulesService } from './services';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
    Permissions,
} from '../../common/decorators';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import type { CurrentUserInterface } from '../../interface';
import { CreateMExportDto, PinStateDto, UpdateAllDto, UpdateMExportDto } from './dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('modules')
export class ModulesController {
    constructor(private readonly moduleService: ModulesService) {}

    @AdminViewDecorator('module')
    @Get('admin-list')
    @ApiOperationDecorator(
        'Get admin module list',
        'Retrieve admin module list and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Modules retrieved successfully')
    @ApiResponseDecorator(403, `Don't have permissions for ads`)
    @ApiQueryDecorator({
        name: 'isActive',
        required: false,
        description: 'Filter module by is active or not',
        type: 'boolean',
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter module by search term',
        type: 'string',
    })
    async adminModulesList(
        @Query('isActive') isActive?: boolean,
        @Query('search') search?: string,
    ) {
        return this.moduleService.getModules({
            active: isActive,
            searchTerm: search,
        });
    }

    @NonAdminOnly()
    @Get('user-list')
    @ApiOperationDecorator(
        'Get user module list',
        'Retrieve user module list and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Modules retrieved successfully')
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter module by search term',
        type: 'string',
    })
    async userModulesList(@Query('search') search?: string) {
        return this.moduleService.userModulesList(search);
    }

    @NonAdminOnly()
    @Get('export-list')
    @ApiOperationDecorator(
        'Get user module exports template list',
        'Retrieve user module export template list and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Modules retrieved successfully')
    async templateList(@CurrentUser() user: CurrentUserInterface) {
        return this.moduleService.getUserMExportTemplates(user);
    }

    @NonAdminOnly()
    @Get('export-list-details/:id')
    @ApiParamDecorator('id')
    @ApiOperationDecorator(
        'Get user module exports template list',
        'Retrieve user module export template list and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Modules retrieved successfully')
    async templateDetails(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.moduleService.getModuleExportTDetails(user, id);
    }

    @NonAdminOnly()
    @Post('export-create')
    @ApiOperationDecorator('Create template export', 'Create template export')
    @ApiResponseDecorator(201, 'Template created successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Not found')
    async createTemplate(@CurrentUser() user: CurrentUserInterface, @Body() dto: CreateMExportDto) {
        return this.moduleService.createMExports(user, dto);
    }

    @NonAdminOnly()
    @Patch('export-update/:id')
    @ApiParamDecorator('id')
    @ApiOperationDecorator('Update template export', 'Update template export')
    @ApiResponseDecorator(201, 'Template created successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Not found')
    async updateTemplate(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: UpdateMExportDto,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.moduleService.updateMExportData(user, dto, id);
    }

    @NonAdminOnly()
    @Get('user-pin-list')
    @ApiOperationDecorator(
        'Get user pin modules list',
        'Retrieve user pin modules list and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Modules retrieved successfully')
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter tools by search term',
        type: 'string',
    })
    async usePinMList(@CurrentUser() user: CurrentUserInterface, @Query('search') search?: string) {
        return this.moduleService.userPinModulesList(user, search);
    }

    @NonAdminOnly()
    @Get('user-tools-list')
    @ApiOperationDecorator(
        'Get user tools list',
        'Retrieve user tools list and transform to ui view',
    )
    @ApiResponseDecorator(200, 'Tools retrieved successfully')
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter tools by search term',
        type: 'string',
    })
    async userToolsList(@Query('search') search?: string) {
        return this.moduleService.userTools(search);
    }

    @Get('details/:id')
    @ApiParamDecorator('module details')
    @ApiOperationDecorator('Get a module', 'Retrieve a module and transform to ui view')
    @ApiResponseDecorator(200, 'Module retrieved successfully')
    @ApiResponseDecorator(404, 'Module not found')
    async moduleDetails(@Param('id', ParseUUIDPipe) id: string) {
        return this.moduleService.moduleDetails(id);
    }

    @NonAdminOnly()
    @Patch('pin-state/:id')
    @ApiParamDecorator('module details')
    @ApiOperationDecorator('Set a pin state for module', 'Pin or unpin a module by user')
    @ApiResponseDecorator(200, 'Pin state set successfully')
    @ApiResponseDecorator(404, 'Module or user not found')
    async modulePinState(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: PinStateDto,
    ) {
        return this.moduleService.modulePinStateByUser(user, id, dto.isPin);
    }

    @AdminViewDecorator('module')
    @Permissions({ ui: 'module', actions: ['update'] })
    @Patch('update/:id')
    @ApiParamDecorator('module')
    @ApiOperationDecorator('Update module', 'Update module with provided information')
    @ApiResponseDecorator(200, 'Module update successfully')
    @ApiResponseDecorator(400, 'Bad request')
    @ApiResponseDecorator(404, 'Module not found')
    async updateModule(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateAllDto) {
        return this.moduleService.updateModule(id, updateDto);
    }

    @AdminViewDecorator('module')
    @Permissions({ ui: 'module', actions: ['update'] })
    @Patch('toggle/:id')
    @ApiParamDecorator('module details')
    @ApiOperationDecorator('Toggle module', 'Activate or deactivate module')
    @ApiResponseDecorator(200, 'Module updated successfully')
    @ApiResponseDecorator(404, 'Module not found')
    async toggle(@Param('id', ParseUUIDPipe) id: string) {
        return this.moduleService.toggleModule(id);
    }

    @AdminViewDecorator('module')
    @Permissions({ ui: 'module', actions: ['delete'] })
    @Delete('header/:moduleId/:id')
    @ApiParamDecorator('module header', 'moduleId')
    @ApiParamDecorator('module header')
    @ApiOperationDecorator(
        'Delete a module header',
        'Remove from existing module header the selected one',
    )
    @ApiResponseDecorator(200, 'Module header deleted successfully')
    async moduleHeaderDelete(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('moduleId', ParseUUIDPipe) moduleId: string,
    ) {
        return this.moduleService.mHeaderService.deleteMHeader(id, moduleId);
    }

    @AdminViewDecorator('module')
    @Permissions({ ui: 'module', actions: ['delete'] })
    @Delete('feature/:moduleId/:id')
    @ApiParamDecorator('module feature', 'moduleId')
    @ApiParamDecorator('module feature')
    @ApiOperationDecorator(
        'Delete a module feature',
        'Remove from existing module feature the selected one',
    )
    @ApiResponseDecorator(200, 'Module feature deleted successfully')
    async moduleFeatureDelete(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('moduleId', ParseUUIDPipe) moduleId: string,
    ) {
        return this.moduleService.mFeatureService.deleteMFeature(id, moduleId);
    }

    @AdminViewDecorator('module')
    @Permissions({ ui: 'module', actions: ['delete'] })
    @Delete('use/:moduleId/:id')
    @ApiParamDecorator('module use')
    @ApiParamDecorator('module perfect for', 'moduleId')
    @ApiOperationDecorator(
        'Delete a module use',
        'Remove from existing module use the selected one',
    )
    @ApiResponseDecorator(200, 'Module use deleted successfully')
    async moduleUseDelete(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('moduleId', ParseUUIDPipe) moduleId: string,
    ) {
        return this.moduleService.mUseService.deleteMUse(id, moduleId);
    }
}
