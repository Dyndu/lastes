import {
    ApiBearerAuth,
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '../../common';
import {
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
} from '../../common/decorators';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import type { CurrentUserInterface } from '../../interface';
import { PSettingsService } from './services';
import { PSettingCreateDto } from './dto/p-setting-create.dto';
import { PSettingUpdateDto } from './dto/p-setting-update.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@NonAdminOnly()
@Controller('settings')
export class PSettingsController {
    constructor(private readonly service: PSettingsService) {}

    @Get('user')
    @ApiOperationDecorator('Get user settings', 'Retrieve only settings created by user')
    @ApiResponseDecorator(200, 'Settings retrieved successfully')
    async userSettings(@CurrentUser() user: CurrentUserInterface) {
        return this.service.retrieveUserSProfile(user.id);
    }

    @Get('metrics')
    @ApiOperationDecorator('Get all metrics', 'Retrieve all seeded metrics')
    @ApiResponseDecorator(200, 'Metric retrieved successfully')
    async allMetrics() {
        return this.service.metricsService.getAllMetrics();
    }

    @Get('details/:id')
    @ApiParamDecorator('Setting')
    @ApiOperationDecorator('Get user setting details', 'Retrieve one setting details')
    @ApiResponseDecorator(200, 'Setting details retrieved successfully')
    async settingDetails(@Param('id', ParseUUIDPipe) id: string) {
        return this.service.settingDetails(id);
    }

    @Post('create')
    @ApiOperationDecorator(
        'Create a new setting profile',
        'Create a new setting profile from provided data in dto',
    )
    @ApiResponseDecorator(201, 'Setting created successfully')
    @ApiResponseDecorator(403, 'Access denied for setting creation')
    @ApiResponseDecorator(404, 'Some related setting entities not found')
    async createNewSettingProfile(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: PSettingCreateDto,
    ) {
        return this.service.createPSetting(user.id, dto);
    }

    @Patch('update/:id')
    @ApiParamDecorator('Setting')
    @ApiOperationDecorator(
        'Update an existing setting profile',
        'Update an existing setting profile from provided data in dto',
    )
    @ApiResponseDecorator(200, 'Setting updated successfully')
    @ApiResponseDecorator(403, 'Access denied for setting profile update')
    @ApiResponseDecorator(404, 'Some related setting profile entities not found')
    async updateSettingProfile(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: PSettingUpdateDto,
    ) {
        return this.service.updatePSetting(user.id, id, updateDto);
    }
}
