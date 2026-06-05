import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { UserEntity } from '../../users/entities/user.entity';
import { MExportEntity } from '../entities';
import { CreateMExportDto, UpdateMExportDto } from '../dto';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { FileUsageEnum } from '../../../common/enum';

@Injectable()
export class MExportService {
    /**
     * Service responsible for handling modules exports operations
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Builds and returns an MExport entity instance.
     * Assigns the provided export metadata, creator, and optional file
     * to the entity before returning the populated instance.
     */
    buildMExportEntity(required: {
        label: string;
        companyName: string;
        phoneNumber: string;
        address: string;
        email: string;
        createdBy: UserEntity;
        file?: FileLinksEntity;
    }) {
        const result = new MExportEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Generates a sequential label for a user's export template.
     * Counts existing non-deleted templates created by the user
     * and returns the next available template label.
     */
    async generateLabel(createdBy: UserEntity): Promise<string> {
        const count = await this.modulesService.mExportRepository.count({
            where: { createdBy: { id: createdBy.id }, deleted: false },
        });
        return `Template ${count + 1}`;
    }

    /**
     * Retrieves all active module export templates created by the provided user.
     * Fetches export templates with optional relations filtering out deleted entries.
     */
    async userMExports(user: UserEntity, relations?: string[]) {
        return await this.modulesService.mExportRepository.find({
            where: { createdBy: { id: user.id }, deleted: false },
            relations,
        });
    }

    /**
     * Retrieves an active module export template matching the provided criteria.
     * Formats and logs the search criteria, fetches the matching entity with optional relations,
     * and throws a not-found error if no matching data exists.
     */
    async retrieveMExportByCriteria(
        criteria: Record<string, any>,
        relation?: string[],
    ): Promise<MExportEntity> {
        const entry = this.modulesService.otherUtils.formatCriteria(criteria);
        this.modulesService.logger.info(`Find a module export template by criteria: ${entry}`);

        const isDataExist = await this.modulesService.mExportRepository.findActiveOne(
            this.modulesService.mExportRepository,
            criteria,
            relation,
        );

        if (!isDataExist)
            this.modulesService.errorHandler.notFound(
                `Data not found with criteria: ${entry}`,
                `Data not found`,
            );

        return isDataExist;
    }

    /**
     * Updates an existing MExport entity with the provided fields.
     * Validates the presence of update data, trims allowed string fields,
     * and persists the filtered update payload to the repository.
     */
    async updateMExport(
        data: MExportEntity,
        itemized?: Partial<{
            label: string;
            companyName: string;
            phoneNumber: string;
            address: string;
            email: string;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return { message: 'No updates provided for holding coast' };

        const stringFields = ['label', 'companyName', 'phoneNumber', 'address', 'email'] as const;
        const updatePayload: Partial<MExportEntity> = {};

        stringFields.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        return await this.modulesService.mExportRepository.update({ id: data.id }, updatePayload);
    }

    /**
     * Validates uniqueness constraints for MExport fields belonging to a user.
     * Checks configured fields and optional label uniqueness against active export templates,
     * collects validation errors, and throws a validation exception if duplicates exist.
     */
    async checkUniqueFields(
        user: UserEntity,
        dto: Partial<CreateMExportDto>,
        id?: string,
    ): Promise<void> {
        const errors: Record<string, string> = {};

        const fieldsToCheck: (keyof CreateMExportDto)[] = [
            'companyName',
            'phoneNumber',
            'address',
            'email',
        ];

        for (const field of fieldsToCheck) {
            await this.modulesService.mExportRepository.assertUniqueActive(
                this.modulesService.mExportRepository,
                errors,
                { [field]: dto[field], createdBy: { id: user.id } },
                'Export template',
                id,
            );
        }

        if (dto.label) {
            await this.modulesService.mExportRepository.assertUniqueActive(
                this.modulesService.mExportRepository,
                errors,
                { label: dto.label, createdBy: { id: user.id } },
                'Export template',
                id,
            );
        }

        if (Object.keys(errors).length > 0)
            throw this.modulesService.errorHandler.validation(errors);
    }

    /**
     * Creates a new module export template for the provided user.
     * Validates phone number format and uniqueness constraints, generates a default label if missing,
     * links the associated file entity, and persists the populated export template entity.
     */
    async createMExport(createdBy: UserEntity, dto: CreateMExportDto): Promise<MExportEntity> {
        this.modulesService.otherUtils.validateAndParsePhone(dto.phoneNumber);
        await this.checkUniqueFields(createdBy, dto);

        const label = dto.label ?? (await this.generateLabel(createdBy));
        const file = await this.modulesService.fileLinksService.linkFileToEntity(
            dto.file,
            FileUsageEnum.MODULE_EXPORT,
        );

        return this.modulesService.mExportRepository.create(
            this.buildMExportEntity({
                label,
                companyName: dto.companyName,
                phoneNumber: dto.phoneNumber,
                address: dto.address,
                email: dto.email,
                createdBy,
                file,
            }),
        );
    }

    /**
     * Updates an existing module export template for the provided user.
     * Retrieves the target export template, handles file replacement and cleanup,
     * validates phone number and uniqueness constraints, and persists the updated data.
     */
    async mExportUpdate(
        user: UserEntity,
        dto: UpdateMExportDto,
        id: string,
        relations?: string[],
    ): Promise<object> {
        const mExport = await this.retrieveMExportByCriteria(
            { createdBy: { id: user.id }, id },
            relations,
        );

        let file = mExport.file;
        if (dto.file) {
            await this.modulesService.fileLinksService.unlinkAndCleanup(file.id);
            await this.modulesService.fileLinksService.linkFileToEntity(
                dto.file,
                FileUsageEnum.MODULE_EXPORT,
            );
        }

        if (dto.phoneNumber) this.modulesService.otherUtils.validateAndParsePhone(dto.phoneNumber);
        await this.checkUniqueFields(user, dto, mExport.id);

        await this.updateMExport(mExport, dto);

        return { message: 'Data updated successfully' };
    }
}
