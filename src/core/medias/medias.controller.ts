import { Controller, Get, Body, Param, ParseUUIDPipe, Patch, Post } from '../../common';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiParamDecorator,
    ApiResponseDecorator,
    Permissions,
} from '../../common/decorators';
import { AddMediaDto } from './dto/add-media.dto';
import { UpdateInfoDto } from './dto/update-info.dto';
import { MediasService } from './services';

@Controller('medias')
export class MediasController {
    constructor(private readonly mediaService: MediasService) {}

    @AdminViewDecorator('media')
    @Get()
    @ApiOperationDecorator('Get a media file', 'Get a media file details and transform to ui view')
    @ApiResponseDecorator(200, 'Media data retrieved successfully.')
    @ApiResponseDecorator(403, 'Forbidden, access required for media retrieval.')
    async mediaFileForAdmin() {
        return this.mediaService.retrieveMedias();
    }

    @AdminViewDecorator('media')
    @Permissions({ ui: 'media', actions: ['create'] })
    @Post()
    @ApiOperationDecorator('Create the media file', 'Add or update the media file')
    @ApiResponseDecorator(200, 'Media data added or updated successfully.')
    @ApiResponseDecorator(403, 'Forbidden, access required for media creation successfully.')
    @ApiResponseDecorator(404, 'Some related media entities not found.')
    async setMediaUrl(@Body() dto: AddMediaDto) {
        return this.mediaService.changeFile(dto);
    }

    @Get('page')
    @ApiOperationDecorator(
        'Retrieve the media file',
        'Route to show media file on the landing page',
    )
    @ApiResponseDecorator(200, 'Media file retrieved successfully.')
    async mediaFileForAll() {
        return this.mediaService.retrieveMedias();
    }

    @Get('social')
    @ApiOperationDecorator('Retrieve social networks', 'Route to get all social networks')
    @ApiResponseDecorator(200, 'Network retrieved successfully.')
    async allSocial() {
        return this.mediaService.socialService.allSocials();
    }

    @Get('footer')
    @ApiOperationDecorator('Retrieve footer information', 'Route to get all footer information')
    @ApiResponseDecorator(200, 'Footer info retrieved successfully.')
    async footerInfo() {
        return this.mediaService.fInfoService.footerInfo();
    }

    @AdminViewDecorator('media')
    @Permissions({ ui: 'media', actions: ['update'] })
    @Patch('social/:id')
    @ApiParamDecorator('social network')
    @ApiOperationDecorator('Toggle the social network', 'Activate or deactivate social network')
    @ApiResponseDecorator(200, 'Social network updated successfully.')
    @ApiResponseDecorator(403, 'Forbidden, access required for social network update.')
    @ApiResponseDecorator(404, 'Some related media entities not found.')
    async toggleSocial(@Param('id', ParseUUIDPipe) id: string) {
        return this.mediaService.socialService.toggleSocial(id);
    }

    @AdminViewDecorator('media')
    @Permissions({ ui: 'media', actions: ['update'] })
    @Patch('footer')
    @ApiOperationDecorator('Update footer', 'Update footer information')
    @ApiResponseDecorator(200, 'Footer info updated successfully.')
    @ApiResponseDecorator(403, 'Forbidden, access required for footer information update.')
    @ApiResponseDecorator(404, 'Some related media entities not found.')
    async updateFooterInfo(@Body() dto: UpdateInfoDto) {
        return this.mediaService.fInfoService.updateFInfo(dto);
    }
}
