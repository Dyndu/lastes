import {
    DeepPartial,
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    Not,
    Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AbstractEntity } from './abstract.entity';

export abstract class AbstractRepository<T extends AbstractEntity<T>> {
    protected constructor(
        protected readonly entityRepository: Repository<T>,
        protected readonly entityManager: EntityManager,
    ) {}

    /**
     * Returns the underlying repository instance for the current entities.
     */
    getRepository = (): Repository<T> => this.entityRepository;

    /**
     * Counts the number of entities matching the given options.
     * Uses the repository's count method to return the total number of entities that match the specified criteria.
     */
    async count(options: FindManyOptions<T>) {
        return this.entityRepository.count(options);
    }

    build(entityLike: DeepPartial<T>): T {
        return this.entityRepository.create(entityLike);
    }

    /**
     * Finds entities matching the given options.
     * Uses the repository's find method to return entities that match the specified criteria.
     */
    async find(options: FindManyOptions<T>): Promise<T[]> {
        return this.entityRepository.find(options);
    }

    /**
     * Finds entities matching the given options and counts them.
     * Uses the repository's findAndCount method to return both the entities that match the specified criteria and the total count.
     */
    async findAndCount(options: FindManyOptions<T>) {
        return this.entityRepository.findAndCount(options);
    }

    /**
     * Finds an entities matching the given options.
     * Uses the repository's findOne method to return the entities that matches the specified criteria.
     */
    async findOne(options: FindOneOptions<T>) {
        return await this.entityRepository.findOne(options);
    }

    /**
     * Creates a new entities in the database.
     * Uses the entities manager's method to persist the entities.
     */
    async create(entity: T) {
        return this.entityManager.save(entity);
    }

    /**
     * Creates multiple new entities in the database.
     * Uses the entities manager's method to persist an array of entities.
     */
    async createMany(entities: T[]) {
        return await this.entityManager.save(entities);
    }

    /**
     * Updates an entities matching the given criteria.
     * Uses the repository's update method to apply partial updates to the entities, then retrieves and returns the updated entities.
     */
    async update(where: FindOptionsWhere<T>, partialEntity: QueryDeepPartialEntity<T>): Promise<T> {
        await this.entityRepository.update(where, partialEntity);

        const updated = await this.findOne({ where });
        if (!updated) throw new Error('Entity not found after update');
        return updated;
    }

    /**
     * Deletes an entities matching the given criteria.
     * Uses the repository's delete method to remove the entities and return a custom message or null.
     */
    async delete(where: FindOptionsWhere<T>) {
        await this.entityRepository.delete(where);
    }

    /**
     * Softly deletes an entities matching the given criteria.
     * Uses the repository's softDelete method to mark the entities as deleted, updates the entities to reflect the deletion, and returns a custom message or null.
     */
    async softDelete(where: FindOptionsWhere<T>) {
        await this.entityRepository.softDelete(where);
        await this.entityRepository.update(where, {
            deleted: true,
        } as unknown as QueryDeepPartialEntity<T>);
    }

    /**
     * Restores a soft-deleted entities matching the given criteria.
     * Uses the repository's restore method to undo the soft deletion, updates the entities to reflect the restoration, and returns a custom message or null.
     */
    async restore(where: FindOptionsWhere<T>) {
        await this.entityRepository.restore(where);
        await this.entityRepository.update(where, {
            deleted: false,
        } as unknown as QueryDeepPartialEntity<T>);
    }

    /**
     * Asserts that no active (non-deleted) entities already exists matching the given criteria.
     * Optionally excludes a specific entities by its identifier and populates the provided error object
     * with a descriptive validation message when a conflict is detected.
     */
    async assertUniqueActive(
        repository: any,
        error: Record<string, string>,
        criteria: Record<string, any>,
        entity: string,
        excludeId?: string,
    ) {
        const where: any = {
            ...criteria,
            deleted: false,
        };

        if (excludeId) where.id = Not(excludeId);

        const isKeyValueExist = await repository.findOne({ where });

        if (isKeyValueExist) {
            const [key] = Object.keys(criteria);
            error[key] =
                `${entity} ${key} already exists with value: ${criteria[key]}. Please provide another one`;
        }
    }

    /**
     * Retrieves a single non-deleted entities from a repository based on the provided criteria.
     * Optionally loads related entities and automatically excludes soft-deleted records.
     */
    async findActiveOne(repository: any, criteria: Record<string, any>, relations?: string[]) {
        return await repository.findOne({
            where: {
                ...criteria,
                deleted: false,
            },
            relations,
        });
    }

    /**
     * Retrieves multiple active (non-deleted) entities from a repository based on the provided criteria.
     * Optionally loads related entities and automatically excludes soft-deleted records.
     */
    async findActiveMany(repository: any, criteria: Record<string, any>, relations?: string[]) {
        return await repository.find({
            where: {
                ...criteria,
                deleted: false,
            },
            relations,
        });
    }
}
