import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { MExportEntity, ModuleEntity } from '../entities';

@Injectable()
export class MTransformService {
    /**
     * Service responsible for transforming module entities to ui view
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Returns an array of module detail fields to be included in queries or transformations.
     */
    moduleDetails = () => ['features', 'headers', 'uses', 'link', 'link.file'];

    /**
     * Returns the list of relations required to fully load an MExport entity.
     * Includes linked file entity and its underlying file data.
     */
    mExportDetails = () => ['file', 'file.file'];

    /**
     * Transforms a module or entities object into a simplified format containing only the ID, label, and icon.
     */
    transformEntity = (d: any) => ({
        id: d.id,
        label: d.label,
        icon: d.icon,
    });

    /**
     * Transforms an array of module or entities objects into simplified formats using the transformEntity method.
     */
    transformEntities = (ds: any[]) => ds.map((d) => this.transformEntity(d));

    /**
     * Transforms a ModuleEntity into a structured format, including its ID, label, color, icon, type, status,
     * descriptions, and associated features, headers, uses, and file (if available).
     * Nested entities are transformed using the transformEntities method.
     */
    transformModule = (m: ModuleEntity) => ({
        id: m.id,
        label: m.label,
        color: m.color,
        icon: m.icon,
        type: m.type,
        isActive: m.isActive,
        description: m.description,
        usageDescription: m.usageDescription,
        features: m.features ? this.transformEntities(m.features) : [],
        headers: m.headers ? this.transformEntities(m.headers) : [],
        uses: m.uses ? this.transformEntities(m.uses) : [],
        file: m.link
            ? this.modulesService.userService.uETransformService.transformFiles(m.link?.file)
            : null,
    });

    /**
     * Transforms a ModuleEntity into an admin-focused format, including ID, label, icon, color, type,
     * activation status, and usage count for administrative purposes.
     */
    transformAdminModule = (m: ModuleEntity) => ({
        id: m.id,
        label: m.label,
        icon: m.icon,
        color: m.color,
        type: m.type,
        isActive: m.isActive,
        usageCount: m.usageCount,
    });

    /**
     * Transforms an array of ModuleEntity objects into admin-focused formats using the transformAdminModule method.
     */
    transformAModules = (ms: ModuleEntity[]) => ms.map((m) => this.transformAdminModule(m));

    /**
     * Transforms a ModuleEntity into a user-focused format, including ID, label, color, icon, type,
     * and description for user-facing displays.
     */
    transformUserModule = (m: ModuleEntity) => ({
        id: m.id,
        label: m.label,
        color: m.color,
        icon: m.icon,
        type: m.type,
        description: m.description,
    });

    /**
     * Transforms an array of ModuleEntity objects into user-focused formats using the transformUserModule method.
     */
    transformUserModules = (ms: ModuleEntity[]) => ms.map((m) => this.transformUserModule(m));

    /**
     * Transforms an MExport entity into a minimal export response object.
     * Maps core export identification fields into a simplified structure.
     */
    transformMExportEntity = (m: MExportEntity) => ({
        id: m.id,
        label: m.label,
    });

    /**
     * Transforms an MExport entity into a detailed export response object.
     * Extends the base export transformation with company details and transformed file data.
     */
    transformMExport = (m: MExportEntity) => ({
        ...this.transformMExportEntity(m),
        companyName: m.companyName,
        address: m.address,
        phoneNumber: m.phoneNumber,
        email: m.email,
        file: this.modulesService.userService.uETransformService.transformFiles(m.file.file),
    });

    /**
     * Transforms a collection of MExport entities into simplified export response objects.
     * Maps each entity using the base MExport entity transformation.
     */
    transformMExportEntities = (m: MExportEntity[]) => m.map((m) => this.transformMExportEntity(m));
}
