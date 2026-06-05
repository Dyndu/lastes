import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SCodesRepository } from './s-codes.repository';
import { OtherUtils } from '../../utils/services/tools';
import { SCodeEntity } from './entities/s-code.entity';
import { ErrorHandlerService } from '../../common/response';
import { SocketService } from '../../helpers/socket/socket.service';
import { SocketEventEnum } from '../../common/enum';
import { CacheService } from '../../helpers/cache/cache.service';

@Injectable()
export class SCodesService {
    /**
     * Service responsible for handling support chats code operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly sCodeRepository: SCodesRepository,
        private readonly otherUtils: OtherUtils,
        private readonly errorHandler: ErrorHandlerService,
        private readonly socketService: SocketService,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Transforms an SCodeEntity object into a simplified object containing only its ID and label.
     */
    transformCode = (sc: SCodeEntity) => ({
        id: sc.id,
        label: sc.label,
    });

    /**
     * Transforms an array of SCodeEntity objects into an array of simplified objects,
     * each containing only the ID and label of the original entities.
     */
    transformCodes = (scs: SCodeEntity[]) => scs.map((sc) => this.transformCode(sc));

    /**
     * Validates that a label is not reserved (e.g., 'other' or 'others') before allowing an action (create, update, delete).
     * Throws a forbidden error if the label is reserved.
     */
    guardReservedLabel(label: string, action: string) {
        if (['other', 'others'].includes(label.trim().toLowerCase()))
            this.errorHandler.forbidden(
                `Support code "others" can't be altered, created or deleted`,
                `Forbidden, can't ${action} with label ${label}`,
            );
    }

    /**
     * Notifies clients about the creation of a short code via socket.
     * Sends the transformed short code data to the '/s-codes' route with the specified event type.
     */
    notifyCodeCreation(sc: SCodeEntity, event: SocketEventEnum) {
        this.socketService.sendDataToRoute('/s-codes', event, this.transformCode(sc));
    }

    /**
     * Clears all cached entries related to support codes by deleting keys with the base 'support-code'.
     */
    async invalidateCodeCache() {
        await this.cacheService.deleteKeysByBase(`support-code`);
    }

    /**
     * Builds a query to retrieve short codes with optional search filtering.
     * Applies pagination (offset/limit), filters by search term if provided,
     * and orders results by update date in descending order.
     */
    retrieveSCodesQuery(
        offset: number,
        limit: number,
        filters: {
            searchTerm?: string;
        },
    ) {
        const { searchTerm } = filters;

        const query = this.sCodeRepository
            .getRepository()
            .createQueryBuilder('codes')
            .andWhere('codes.deleted = false');

        if (searchTerm) {
            const likePattern = `%${searchTerm.split('').join('%')}%`;
            query.andWhere(`(codes.label ILIKE :searchTerm)`, {
                searchTerm: likePattern,
            });
        }

        return query.orderBy('codes.updatedAt', 'DESC').skip(offset).take(limit);
    }

    /**
     * Retrieves a paginated list of support codes, optionally filtered by a search term.
     * Uses caching to optimize performance, generating a unique cache key based on the search term.
     * Returns transformed support code entities (ID and label) for the requested page and limit.
     */
    async getAllSCodes(
        page: number,
        limit: number,
        filters: {
            searchTerm?: string;
        },
    ) {
        this.logger.info('Getting all support codes');

        const { searchTerm } = filters;

        const baseKey = this.cacheService.generateRedisKey('support-code', {
            ...(searchTerm ? { search: searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                searchTerm,
            },
            (offset: number, limit: number) =>
                this.retrieveSCodesQuery(offset, limit, {
                    searchTerm,
                }),
            (items: SCodeEntity[]) => this.transformCodes(items),
        );
    }

    /**
     * Retrieves a single active support code entities based on the provided criteria.
     * Logs the search criteria and throws a not found error if no matching support code exists.
     */
    async retrieveSCodeByCriteria(criteria: Record<string, any>): Promise<SCodeEntity> {
        const entries = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Find a support code by ${entries}`);

        const isCodeExist = await this.sCodeRepository.findActiveOne(
            this.sCodeRepository,
            criteria,
        );

        if (!isCodeExist)
            this.errorHandler.notFound(
                `Support code not found with ${entries}`,
                `Support code not found`,
            );

        return isCodeExist;
    }

    /**
     * Ensures that a support code label is unique among active records.
     * Validates the label against existing records, excluding the provided ID if present.
     * Throws a validation error if the label is already in use.
     */
    async ensureLabelIsUnique(label: string, id?: string) {
        const errors: Record<string, any> = {};

        await this.sCodeRepository.assertUniqueActive(
            this.sCodeRepository,
            errors,
            { label },
            'Support code',
            id,
        );

        if (errors && errors.length > 0) this.errorHandler.validation(errors);
    }

    /**
     * Creates a new support code with the provided label.
     * Validates that the label is not reserved and is unique before creation.
     * Notifies connected clients via socket about the new code and invalidates the cache.
     * Returns a success message upon completion.
     */
    async createCode(label: string) {
        this.logger.info(`Creating support code with ${label}`);

        this.guardReservedLabel(label, 'create');
        await this.ensureLabelIsUnique(label);

        const code = new SCodeEntity();
        code.label = label.trim();

        const sCode = await this.sCodeRepository.create(code);

        this.notifyCodeCreation(sCode, SocketEventEnum.SUPPORT_CODE_CREATED);
        await this.invalidateCodeCache();

        return { message: 'Code created successfully.' };
    }

    /**
     * Updates an existing support code by its ID with a new label.
     * Validates that the new label is not reserved and is unique, excluding the current code's ID.
     * Notifies connected clients via socket about the update and invalidates the cache.
     * Returns a success message upon completion.
     */
    async updateCode(id: string, label: string) {
        this.logger.info(`Update support code with ${label}`);
        const isCodeExist = await this.retrieveSCodeByCriteria({ id });
        this.guardReservedLabel(isCodeExist.label, 'update');

        if (label) {
            await this.ensureLabelIsUnique(label, id);
            isCodeExist.label = label.trim();
        }

        await this.sCodeRepository.update({ id }, isCodeExist);

        this.notifyCodeCreation(isCodeExist, SocketEventEnum.SUPPORT_CODE_UPDATED);
        await this.invalidateCodeCache();

        return { message: 'Code updated successfully.' };
    }

    /**
     * Deletes a support code by its ID after verifying its existence.
     * Validates that the label is not reserved before deletion.
     * Notifies connected clients via socket about the deletion and invalidates the cache.
     * Returns a success message upon completion.
     */
    async deleteCode(id: string) {
        this.logger.info(`Delete support code with ${id}`);
        const isCodeExist = await this.retrieveSCodeByCriteria({ id });

        this.guardReservedLabel(isCodeExist.label, 'delete');

        await this.sCodeRepository.delete({ id });

        this.notifyCodeCreation(isCodeExist, SocketEventEnum.SUPPORT_CODE_DELETED);
        await this.invalidateCodeCache();

        return { message: 'Code deleted successfully.' };
    }
}
