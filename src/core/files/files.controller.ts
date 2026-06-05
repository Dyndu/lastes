import {
    Controller,
    NotFoundException,
    Post,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
    ApiBody,
    ApiConsumes,
    ApiTags,
} from '../../common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileEntity } from './entities/file.entity';
import { FilesService } from './services/files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
    constructor(private readonly service: FilesService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Create File',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File',
                },
            },
        },
    })
    async createFile(@UploadedFile() file: Express.Multer.File): Promise<FileEntity> {
        if (!file) throw new NotFoundException('File is undefined');
        return await this.service.createFileFromUpload(file);
    }

    @Post('upload-multiple')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Create Multiple Files',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: 'Array of files',
                },
            },
        },
    })
    async createMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<FileEntity[]> {
        if (!files || files.length === 0) throw new NotFoundException('No files were uploaded');
        return await this.service.createFilesFromUploads(files);
    }
}
