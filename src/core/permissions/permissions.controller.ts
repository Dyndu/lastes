import { Controller, Get } from '../../common';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiResponseDecorator,
} from '../../common/decorators';
import { PermissionsService } from './permissions.service';

@AdminViewDecorator('admin_users')
@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permsService: PermissionsService) {}

    @Get()
    @ApiOperationDecorator('Retrieve permissions', 'Get all permissions and transform to ui view')
    @ApiResponseDecorator(200, 'Permissions retrieved successfully.')
    @ApiResponseDecorator(403, 'Access denied.')
    async allPerms() {
        return this.permsService.allPermissions();
    }
}
