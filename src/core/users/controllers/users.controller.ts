import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiQuery,
    Query,
} from '../../../common';
import { UsersService } from '../services';
import {
    AdminRegisterDto,
    AdminUserUpdateBySDto,
    PasswordChangeDto,
    PasswordResetDto,
    UserLoginDto,
    UserRegisterDto,
    UserUpdateDto,
    VerifyUserCodeDto,
} from '../dto';
import { JwtAuthGuard, PermissionsGuard } from '../../../common/guard';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    ApiResponseDecorator,
    CurrentUser,
    Permissions,
} from '../../../common/decorators';
import type { CurrentUserInterface } from '../../../interface';
import { UsagePeriod, UserStatusEnum } from '../../../common/enum';
import { EmailDto } from '../../../common/dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @AdminViewDecorator('admin_users')
    @Get()
    @ApiOperation({
        summary: 'All admins user',
        description: 'Get all the admin and support users non deleted in the database',
    })
    @ApiResponse({
        status: 200,
        description: 'Success',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
    })
    @ApiQuery({
        name: 'page',
        description: 'The page number for pagination (default: 1)',
        type: Number,
    })
    @ApiQuery({
        name: 'limit',
        description: 'The number of results per page (default: 10, max: 100)',
        type: Number,
    })
    @ApiQuery({
        name: 'status',
        required: false,
        description: 'Filter users by status',
        enum: UserStatusEnum,
    })
    @ApiQuery({
        name: 'search',
        required: false,
        description: 'Filter users by key word',
        type: String,
    })
    async allAdmins(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: UserStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.usersService.allAdminUsers(
            Math.max(1, Number.parseInt(page as any, 10) || 1),
            Math.min(100, Math.max(1, Number.parseInt(limit as any, 10) || 10)),
            {
                status,
                searchTerm: search,
            },
        );
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperationDecorator('Get the current user', 'Get the current user')
    @ApiResponseDecorator(200, 'Return the current user')
    @ApiResponseDecorator(401, 'Unauthorized')
    getUserFromToken(@CurrentUser() user: CurrentUserInterface) {
        return this.usersService.userConnectedInfo(user);
    }

    @Get('has-super-admin')
    @ApiOperationDecorator('Verify if a super admin exists', 'Check if a super admin exists')
    @ApiResponseDecorator(200, 'Return boolean')
    async hasSuperAdmin() {
        return await this.usersService.ensureSuperAdminExist();
    }

    @Post('register/super-admin')
    @ApiOperationDecorator(
        'Register the super admin',
        'Create the super and save it in the database',
    )
    @ApiResponseDecorator(201, 'Super admin created successfully.')
    @ApiResponseDecorator(409, `Some of the user information's already exist`)
    @ApiResponseDecorator(403, 'Forbidden')
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(404, 'Not found')
    async registerSAdmin(@Body() createUser: UserRegisterDto) {
        return await this.usersService.registerSuperAdmin(createUser);
    }

    @AdminViewDecorator('admin_users')
    @Permissions({ ui: 'admin_users', actions: ['create'] })
    @Post('create-admin')
    @ApiOperationDecorator(
        'Register a new admin user',
        'Create a new admin user and save it in the database',
    )
    @ApiResponseDecorator(201, 'User created successfully.')
    @ApiResponseDecorator(409, `Some of the user information's already exist`)
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(403, 'Forbidden.')
    @ApiResponseDecorator(404, 'Role, designation or status not found')
    async registerAdmin(@Body() createUser: AdminRegisterDto) {
        return await this.usersService.registerAdmin(createUser);
    }

    @Post('register')
    @ApiOperationDecorator('Register a new user', 'Create a new user and save it in the database')
    @ApiResponseDecorator(201, 'User created successfully.')
    @ApiResponseDecorator(409, `Some of the user information's already exist`)
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(404, 'Role, designation or status not found')
    async register(@Body() createUser: UserRegisterDto) {
        return await this.usersService.registerUser(createUser);
    }

    @Post('login')
    @ApiOperationDecorator('Login an user', 'Login an user with his credentials')
    @ApiResponseDecorator(201, 'User logged in successfully.')
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(403, 'Forbidden.')
    @ApiResponseDecorator(404, 'User not found')
    async login(@Body() loginUser: UserLoginDto) {
        return await this.usersService.loginUser(loginUser);
    }

    @Post('verify-code')
    @ApiOperationDecorator('Verify user code', 'Verify user code provided with the existing one')
    @ApiResponseDecorator(200, 'User code verified successfully.')
    @ApiResponseDecorator(404, 'User or code not found.')
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(401, 'Unauthorized, invalid code.')
    async verifyUserCode(@Req() req: any, @Body() verifyUserCodeDto: VerifyUserCodeDto) {
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;
        return this.usersService.verifyUserCode(verifyUserCodeDto, userAgent, ipAddress);
    }

    @Patch('ask-for-new-otp')
    @ApiOperationDecorator(
        'Ask for a new otp',
        'An owner can ask for new otp if he has lost the previous for any reason',
    )
    @ApiResponseDecorator(200, 'Otp send to the user successfully')
    @ApiResponseDecorator(404, 'User or code not found.')
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(401, 'Unauthorized, User not log in.')
    async askForNewOtp(@Body() email: EmailDto) {
        return this.usersService.resendCode(email.email);
    }

    @Post('send-forgot-password-link')
    @ApiOperationDecorator(
        'Send a forgot password email',
        'Send a forgot password email to the user',
    )
    @ApiResponseDecorator(200, 'User code verified successfully.')
    @ApiResponseDecorator(404, 'User or code not found.')
    @ApiResponseDecorator(400, 'Bad request.')
    @ApiResponseDecorator(401, 'Unauthorized, User not owner.')
    async forgotPassword(@Body(ValidationPipe) emailDto: EmailDto) {
        return await this.usersService.createResetPasswordRequest(emailDto.email);
    }

    @Patch('reset-password/:id')
    @ApiParamDecorator('id', 'Id of the reset password request')
    @ApiOperationDecorator('Reset or set user password', 'Reset or set user password')
    @ApiResponseDecorator(200, 'Password set or reset successfully.')
    @ApiResponseDecorator(404, 'User not found.')
    @ApiResponseDecorator(400, 'Bad request.')
    async resetPassword(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) resetPasswordDto: PasswordResetDto,
    ) {
        return await this.usersService.resetPassword(id, resetPasswordDto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch('update-password')
    @ApiOperationDecorator('Update user password', 'Update user password')
    @ApiResponseDecorator(200, 'Password update successfully.')
    @ApiResponseDecorator(400, 'Bad request.')
    async updatePassword(
        @CurrentUser() user: CurrentUserInterface,
        @Body(ValidationPipe) resetPasswordDto: PasswordChangeDto,
    ) {
        return this.usersService.updatePassword(user.id, resetPasswordDto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard)
    @Patch('me')
    @ApiOperationDecorator('Update user information', 'Update user information')
    @ApiResponseDecorator(200, 'Information update successfully.')
    @ApiResponseDecorator(400, 'Bad request.')
    async updateUserInfos(
        @CurrentUser() user: CurrentUserInterface,
        @Body(ValidationPipe) dto: UserUpdateDto,
    ) {
        return this.usersService.updateUserInfo(user, dto);
    }

    @AdminViewDecorator('admin_users')
    @Permissions({ ui: 'admin_users', actions: ['update'] })
    @Patch('admins/:id')
    @ApiParamDecorator('id', 'Id of the user')
    @ApiOperationDecorator(
        'Update admin information',
        'Update admin information by super admin or qualified admin',
    )
    @ApiResponseDecorator(200, 'Information update successfully.')
    @ApiResponseDecorator(400, 'Bad request.')
    async updateAdminInfos(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(ValidationPipe) dto: AdminUserUpdateBySDto,
    ) {
        return this.usersService.updateAdminUser(id, dto);
    }

    @ApiBearerAuth('JWT')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @AdminViewDecorator('user')
    @Get('overview/registers')
    @ApiOperationDecorator(
        'Get new registers chart',
        'Monthly registrations for current vs previous period',
    )
    @ApiResponseDecorator(200, 'Chart data retrieved successfully')
    @ApiQueryDecorator({ name: 'period', description: 'Usage period', enum: UsagePeriod })
    async getNewRegistersChart(@Query('period') period: UsagePeriod) {
        return this.usersService.getNewRegistersChart(period);
    }
}
