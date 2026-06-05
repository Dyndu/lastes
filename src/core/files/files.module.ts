import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { FileEntity } from './entities/file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './services/files.service';
import { FilesRepository } from './repositories/files.repository';
import { FileLinksEntity } from './entities/file-links.entity';
import { FileLinksRepository } from './repositories/file-links.repository';
import { FileLinksService } from './services/file-links.service';

@Global()
@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([FileEntity, FileLinksEntity])],
    controllers: [FilesController],
    providers: [FilesService, FilesRepository, FileLinksRepository, FileLinksService],
    exports: [FilesService, FilesRepository, FileLinksRepository, FileLinksService],
})
export class FilesModule {}
