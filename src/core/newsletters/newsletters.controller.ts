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
import { NewsletterChannelEnum, NewsletterStatusEnum } from '../../common/enum';
import {
    AdminViewDecorator,
    PaginationQueryDecorator,
    Permissions,
    ApiResponseDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiQueryDecorator,
    CurrentUser,
} from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { NewslettersService } from './services/newsletters.service';
import { NewsCreateDto } from './dto/news-create.dto';
import type { CurrentUserInterface } from '../../interface';
import { NewsUpdateDto } from './dto/news-update.dto';

@Controller('newsletter')
@AdminViewDecorator('newsletter')
export class NewslettersController {
    constructor(private readonly nlService: NewslettersService) {}

    @Get()
    @ApiOperationDecorator(
        'Retrieve all newsletters',
        'Get all newsletters non deleted in the database',
    )
    @ApiResponseDecorator(200, 'Newsletters retrieve successfully')
    @ApiResponseDecorator(403, `Don't have permissions for newsletters`)
    @PaginationQueryDecorator()
    @ApiQueryDecorator({
        name: 'status',
        required: false,
        description: 'Filter newsletters by provided status',
        enum: NewsletterStatusEnum,
    })
    @ApiQueryDecorator({
        name: 'channel',
        required: true,
        description: 'Filter newsletters by provided channel',
        enum: NewsletterChannelEnum,
    })
    @ApiQueryDecorator({
        name: 'search',
        required: false,
        description: 'Filter newsletters by search term',
        type: 'string',
    })
    async nonDeletedNews(
        @Query() pagination: PaginationDto,
        @Query('channel') channel: NewsletterChannelEnum,
        @Query('status') status?: NewsletterStatusEnum,
        @Query('search') search?: string,
    ) {
        return this.nlService.getAllNewsletters(pagination.getPage(), pagination.getLimit(), {
            channel,
            status,
            searchTerm: search,
        });
    }

    @Get(':id')
    @ApiParamDecorator('News letter')
    @ApiOperationDecorator(
        'Get a news letter by its id',
        'Get news letter by its id and transform data to the ui view',
    )
    @ApiResponseDecorator(200, 'News letter details')
    @ApiResponseDecorator(403, `Don't have permissions for news letter details`)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.nlService.newsLetterDetails(id);
    }

    @Permissions({ ui: 'newsletter', actions: ['create'] })
    @Post()
    @ApiOperationDecorator(
        'Create a new news letter',
        'Create a new news letter with the provided dto data and send to users',
    )
    @ApiResponseDecorator(201, 'Create a news letter')
    @ApiResponseDecorator(400, 'Failed validation from create news letter dto')
    @ApiResponseDecorator(403, `Can't create news letter. Access denied`)
    @ApiResponseDecorator(404, 'Some news letter related entities not found')
    async createNewsLetter(@CurrentUser() user: CurrentUserInterface, @Body() dto: NewsCreateDto) {
        return this.nlService.createNewsletter(user.id, dto);
    }

    @Permissions({ ui: 'newsletter', actions: ['update'] })
    @Patch('/update/:id')
    @ApiParamDecorator('News letter')
    @ApiOperationDecorator(
        'Update an existing news letter',
        'Update a news letter with the provided dto data',
    )
    @ApiResponseDecorator(200, 'Update an existing news letter')
    @ApiResponseDecorator(400, 'Failed validation from update news letter dto')
    @ApiResponseDecorator(403, `Can't update news letter. Access denied`)
    @ApiResponseDecorator(404, 'Some news letter related entities or news letter not found')
    async updateNewLetter(
        @CurrentUser() user: CurrentUserInterface,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: NewsUpdateDto,
    ) {
        return this.nlService.updateNewsletter(user.id, id, updateDto);
    }

    @Permissions({ ui: 'newsletter', actions: ['delete'] })
    @Delete('/:id')
    @ApiParamDecorator('News letter')
    @ApiOperationDecorator('Delete a new letter', 'Delete a new letter from provided id')
    @ApiResponseDecorator(200, 'News letter deleted successfully')
    @ApiResponseDecorator(400, 'Failed validation for uuid')
    @ApiResponseDecorator(404, 'News letter not found')
    async deleteNewsLetter(@Param('id', ParseUUIDPipe) id: string) {
        return this.nlService.deleteNewLetter(id);
    }
}
