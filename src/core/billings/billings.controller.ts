import { ApiBearerAuth } from '@nestjs/swagger';
import {
    Controller,
    Get,
    Query,
    Delete,
    Body,
    Post,
    UseGuards,
    Headers,
    HttpCode,
    Req,
    Param,
    Patch,
} from '../../common';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    CurrentUser,
    NonAdminOnly,
    PaginationQueryDecorator,
} from '../../common/decorators';
import { BillingsService } from './services';
import { PaginationDto } from '../../common/dto';
import { ChangePeriodDto, CreateCheckoutDto, SetDefaultPaymentDto } from './dto';
import type { CurrentUserInterface } from '../../interface';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import {
    IncomeCategoryEnum,
    InvoiceStatusEnum,
    UsagePeriod,
    UserStatusEnum,
} from '../../common/enum';

@Controller('billings')
export class BillingsController {
    constructor(private readonly billingsService: BillingsService) {}

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('billing')
    @Get()
    @ApiOperationDecorator('Get all invoices', 'Get all invoices non deleted in the database')
    @ApiResponseDecorator(200, 'Invoices of user retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions for invoices`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'userId',
        description: 'Filter invoices by provided userId',
        type: 'string',
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter invoices by search term',
        type: 'string',
    })
    async getInvoicesByAdmin(
        @Query() pagination: PaginationDto,
        @Query('userId') userId: string,
        @Query('search') search?: string,
    ) {
        return this.billingsService.getUserInvoicesByAdmin(
            pagination.getPage(),
            pagination.getLimit(),
            {
                userId,
                searchTerm: search,
            },
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('billing')
    @Get('recent-income')
    @ApiOperationDecorator(
        'Get recent invoices income',
        'Get recent invoices income non deleted in the database',
    )
    @ApiResponseDecorator(200, 'Invoices retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions for invoices`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'category',
        description: 'Filter invoices by category',
        enum: IncomeCategoryEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter invoices by search term',
        type: 'string',
    })
    async getLastIncome(
        @Query('category') category: IncomeCategoryEnum,
        @Query('search') search?: string,
    ) {
        return this.billingsService.getRecentIncome({
            limit: 5,
            category,
            searchTerm: search,
        });
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('billing')
    @Get('members')
    @ApiOperationDecorator(
        'Get members list',
        'Get paginated list of members with income and subscriptions stats',
    )
    @ApiResponseDecorator(200, 'Members retrieved successfully')
    @ApiResponseDecorator(403, `Don't have permissions for members`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        description: 'Filter members by status',
        enum: UserStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter members by name',
        type: 'string',
    })
    async getMembers(
        @Query() pagination: PaginationDto,
        @Query('status') status: UserStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.billingsService.getMembers(pagination.getPage(), pagination.getLimit(), {
            status,
            searchTerm: search,
        });
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('billing')
    @Get('members/:userId')
    @ApiParamDecorator('userId', 'User ID')
    @ApiOperationDecorator(
        'Get member by id',
        'Get a single member with income and subscriptions stats',
    )
    @ApiResponseDecorator(200, 'Member retrieved successfully')
    @ApiResponseDecorator(404, 'Member not found')
    async getMemberById(@Param('userId') userId: string) {
        return this.billingsService.getMemberById(userId);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Get('user')
    @ApiOperationDecorator(
        'Get user connected invoices',
        'Get user connected invoices non deleted in the database',
    )
    @ApiResponseDecorator(200, 'Invoices of user retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions for invoices`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        description: 'Filter invoices by status',
        enum: InvoiceStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter invoices by search term',
        type: 'string',
    })
    async userInvoices(
        @CurrentUser() user: CurrentUserInterface,
        @Query() pagination: PaginationDto,
        @Query('status') status: InvoiceStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.billingsService.userInvoices(
            user,
            pagination.getPage(),
            pagination.getLimit(),
            {
                status,
                searchTerm: search,
            },
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('billing')
    @Get('overview/income')
    @ApiOperationDecorator(
        'Get income overview',
        'Get income distribution and comparison vs previous period',
    )
    @ApiResponseDecorator(200, 'Income overview retrieved successfully')
    @ApiQueryDecorator({
        name: 'period',
        description: 'Usage period',
        enum: UsagePeriod,
    })
    async getIncomeOverview(@Query('period') period: UsagePeriod) {
        return this.billingsService.preBillingsService.getIncomeOverview(period);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @ApiOperationDecorator('Get user sub info', 'Get subscription information')
    @ApiResponseDecorator(200, 'Information retrieved successfully')
    @Get('subscription/details')
    async getSubscription(@CurrentUser() user: CurrentUserInterface) {
        return this.billingsService.userSubInfo(user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Post('checkout')
    @ApiOperationDecorator('Create checkout session', 'Redirect URL to Stripe checkout page')
    @ApiResponseDecorator(201, 'Checkout session created successfully')
    @ApiResponseDecorator(400, 'Invalid period or coupon')
    @ApiResponseDecorator(409, 'User already has an active subscription')
    async createCheckout(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: CreateCheckoutDto,
    ) {
        return this.billingsService.createCheckout(user, dto);
    }

    @Post('webhook')
    @HttpCode(200)
    async handleWebhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
        const event = this.billingsService.stripeService.constructWebhookEvent(
            (req as any).rawBody,
            signature,
            this.billingsService.envConfig.stripeWebhookSecret,
        );
        await this.billingsService.sWebhookService.handle(event);
        return { received: true };
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Patch('auto-renew')
    @ApiOperationDecorator('Toggle auto renew', 'Toggle auto renew for current subscription')
    @ApiResponseDecorator(200, 'Auto renew toggled successfully')
    async toggleAutoRenew(@CurrentUser() user: CurrentUserInterface) {
        return this.billingsService.toggleAutoRenew(user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Patch('period')
    @ApiOperationDecorator('Change subscription period', 'Switch between monthly and yearly')
    @ApiResponseDecorator(200, 'Period updated successfully')
    async changePeriod(@CurrentUser() user: CurrentUserInterface, @Body() dto: ChangePeriodDto) {
        return this.billingsService.subscriptionService.changePeriod(user.id, dto.period);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Delete('cancel')
    @ApiOperationDecorator('Cancel subscription', 'Cancel current subscription immediately')
    @ApiResponseDecorator(200, 'Subscription cancelled successfully')
    async cancelNow(@CurrentUser() user: CurrentUserInterface) {
        return this.billingsService.subscriptionService.cancelNow(user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Get('payment-methods')
    @ApiOperationDecorator('Get payment methods', 'Get all saved payment methods for current user')
    @ApiResponseDecorator(200, 'Payment methods retrieved successfully')
    @ApiResponseDecorator(404, 'No active subscription found')
    async getPaymentMethods(@CurrentUser() user: CurrentUserInterface) {
        return this.billingsService.getPaymentMethods(user.id);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Delete('payment-methods/:paymentMethodId')
    @ApiParamDecorator('paymentMethodId', 'Payment method')
    @ApiOperationDecorator('Remove payment method', 'Detach a payment method from current user')
    @ApiResponseDecorator(200, 'Payment method removed successfully')
    @ApiResponseDecorator(404, 'Payment method not found')
    async detachPaymentMethod(@Param('paymentMethodId') paymentMethodId: string) {
        return this.billingsService.detachPaymentMethod(paymentMethodId);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @NonAdminOnly()
    @Patch('payment-methods/default')
    @ApiOperationDecorator(
        'Set default payment method',
        'Set a payment method as default for future invoices',
    )
    @ApiResponseDecorator(200, 'Default payment method updated successfully')
    @ApiResponseDecorator(404, 'No active subscription found')
    async setDefaultPaymentMethod(
        @CurrentUser() user: CurrentUserInterface,
        @Body() dto: SetDefaultPaymentDto,
    ) {
        return this.billingsService.setDefaultPaymentMethod(user.id, dto.paymentMethodId);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('billing')
    @Get('overview/subscription-period')
    @ApiOperationDecorator(
        'Get subscription period ratio',
        'Get monthly and yearly subscription percentage distribution',
    )
    @ApiResponseDecorator(200, 'Subscription period ratio retrieved successfully')
    async getSubscriptionPeriodRatio() {
        return this.billingsService.preBillingsService.getSubscriptionPeriodRatio();
    }
}
