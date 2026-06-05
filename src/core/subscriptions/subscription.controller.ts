import {
    ApiBearerAuth,
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UseGuards,
    Patch,
} from '../../common';
import { JwtAuthGuard } from '../../common/guard';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiResponseDecorator,
} from '../../common/decorators';
import { SubscriptionService } from './subscription.service';
import { SPlanUpdateDto } from './dto/s-plan-update.dto';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('s-plans')
export class SubscriptionController {
    constructor(private readonly service: SubscriptionService) {}

    @AdminViewDecorator('billing')
    @Get()
    @ApiOperationDecorator(
        'Get subscription plans prices',
        'Get subscription plans prices and transform result to ui view',
    )
    @ApiResponseDecorator(200, 'Subscription plan prices code details retrieve successfully')
    @ApiResponseDecorator(404, 'Subscription plan prices code not found')
    async findOne() {
        return this.service.getPlanPrices();
    }

    @AdminViewDecorator('billing')
    @Patch(':id')
    @ApiParamDecorator('s-plans')
    @ApiOperationDecorator('Update a new s-plans', 'Update a new s-plans')
    @ApiResponseDecorator(200, 'Subscription plan prices code retrieved successfully')
    @ApiResponseDecorator(400, 'Errors from validators')
    @ApiResponseDecorator(403, 'Forbidden')
    async updateSubscription(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SPlanUpdateDto) {
        return this.service.updateSPlans(id, dto);
    }
}
