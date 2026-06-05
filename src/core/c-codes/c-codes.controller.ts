import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Delete,
} from '../../common';
import {
    AdminViewDecorator,
    PaginationQueryDecorator,
    Permissions,
    ApiResponseDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
} from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { CCodesService } from './services/c-codes.service';
import { CCodeCreateDto } from './dto/c-code-create.dto';
import { CCodeUpdateDto } from './dto/c-code-update.dto';

@AdminViewDecorator('affiliation')
@Controller('affiliation')
export class CCodesController {
    constructor(private readonly cCodeService: CCodesService) {}

    @Get()
    @ApiOperationDecorator(
        'Get all code coupon',
        'Get all coupon codes non deleted in the database',
    )
    @ApiResponseDecorator(200, 'Code retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions for affiliation`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter affiliation by search term',
        type: 'string',
    })
    async nonDeletedCCodes(@Query() pagination: PaginationDto, @Query('search') search?: string) {
        return this.cCodeService.allCouponCodes(pagination.getPage(), pagination.getLimit(), {
            searchTerm: search,
        });
    }

    @Get(':id')
    @ApiParamDecorator('affiliation')
    @ApiOperationDecorator(
        'Get an affiliation by its id',
        'Get affiliation by its id and transform data to the ui view',
    )
    @ApiResponseDecorator(200, 'Code coupon details')
    @ApiResponseDecorator(403, `Don't have permissions for affiliation details`)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.cCodeService.cCodeDetails(id);
    }

    @Permissions({ ui: 'affiliation', actions: ['create'] })
    @Post()
    @ApiOperationDecorator(
        'Create a new code coupon',
        'Create a new code coupon with the provided dto data',
    )
    @ApiResponseDecorator(201, 'Create a new code coupon')
    @ApiResponseDecorator(400, 'Failed validation from create code coupon dto')
    @ApiResponseDecorator(403, `Can't create code coupon. Access denied`)
    async createCCoupon(@Body() dto: CCodeCreateDto) {
        return this.cCodeService.createCCode(dto);
    }

    @Permissions({ ui: 'affiliation', actions: ['update'] })
    @Patch('/update/:id')
    @ApiParamDecorator('affiliation')
    @ApiOperationDecorator(
        'Update an existing code coupon',
        'Update code coupon with the provided dto data',
    )
    @ApiResponseDecorator(200, 'Update an existing code coupon')
    @ApiResponseDecorator(400, 'Failed validation from update code coupon dto')
    @ApiResponseDecorator(403, `Can't update code coupon. Access denied`)
    @ApiResponseDecorator(404, 'code coupon not found')
    async updateCCode(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: CCodeUpdateDto) {
        return this.cCodeService.updateCCode(id, updateDto);
    }

    @Permissions({ ui: 'affiliation', actions: ['delete'] })
    @Delete('/:id')
    @ApiParamDecorator('affiliation')
    @ApiOperationDecorator(
        'Delete an existing code coupon',
        'Delete code coupon with the provided dto data',
    )
    @ApiResponseDecorator(200, 'Code coupon deleted successfully')
    @ApiResponseDecorator(404, 'code coupon not found')
    async deleteCCode(@Param('id', ParseUUIDPipe) id: string) {
        return this.cCodeService.deleteCCode(id);
    }
}
