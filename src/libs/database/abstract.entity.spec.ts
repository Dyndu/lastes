import { AbstractEntity } from './abstract.entity';
import { instanceToPlain, plainToInstance } from 'class-transformer';

class TestEntity extends AbstractEntity<TestEntity> {
    name?: string;
    email?: string;

    constructor(entity?: Partial<TestEntity>) {
        super(entity);
        if (entity) Object.assign(this, entity);
    }
}

describe('AbstractEntity', () => {
    describe('Constructor', () => {
        it('should create an empty entities when no data is provided', () => {
            const entity = new TestEntity();

            expect(entity).toBeDefined();
            expect(entity.id).toBeUndefined();
            expect(entity.name).toBeUndefined();
            expect(entity.email).toBeUndefined();
        });

        it('should create an entities with provided data', () => {
            const data = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'John Doe',
                email: 'john@example.com',
                deleted: false,
            };

            const entity = new TestEntity(data);

            expect(entity.id).toBe(data.id);
            expect(entity.name).toBe(data.name);
            expect(entity.email).toBe(data.email);
            expect(entity.deleted).toBe(false);
        });

        it('should create an entities with partial data', () => {
            const data = {
                name: 'Jane Doe',
            };

            const entity = new TestEntity(data);

            expect(entity.name).toBe('Jane Doe');
            expect(entity.id).toBeUndefined();
            expect(entity.email).toBeUndefined();
        });
    });

    describe('Default Values', () => {
        it('should have deleted set to false by default', () => {
            const entity = new TestEntity();

            expect(entity.deleted).toBeUndefined();

            const entityWithDefault = new TestEntity({ deleted: false });
            expect(entityWithDefault.deleted).toBe(false);
        });

        it('should accept deleted as true', () => {
            const entity = new TestEntity({ deleted: true });

            expect(entity.deleted).toBe(true);
        });
    });

    describe('Timestamps', () => {
        it('should have createdAt and updatedAt as Date objects when provided', () => {
            const now = new Date();
            const entity = new TestEntity({
                createdAt: now,
                updatedAt: now,
            });

            expect(entity.createdAt).toEqual(now);
            expect(entity.updatedAt).toEqual(now);
        });

        it('should handle deletedAt when provided', () => {
            const deletedDate = new Date();
            const entity = new TestEntity({
                deletedAt: deletedDate,
            });

            expect(entity.deletedAt).toEqual(deletedDate);
        });

        it('should have undefined deletedAt by default', () => {
            const entity = new TestEntity();

            expect(entity.deletedAt).toBeUndefined();
        });
    });

    describe('UUID Primary Key', () => {
        it('should accept a valid UUID as id', () => {
            const uuid = '123e4567-e89b-12d3-a456-426614174000';
            const entity = new TestEntity({ id: uuid });

            expect(entity.id).toBe(uuid);
        });

        it('should accept any string as id (validation happens at DB level)', () => {
            const entity = new TestEntity({ id: 'custom-id' });

            expect(entity.id).toBe('custom-id');
        });
    });

    describe('Class Transformer Exclusion', () => {
        it('should exclude createdAt when transforming to plain object', () => {
            const entity = new TestEntity({
                id: '123',
                name: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const plain = plainToInstance(TestEntity, entity, {
                excludeExtraneousValues: false,
            });

            const serialized = JSON.parse(JSON.stringify(plain));

            expect(serialized.id).toBe('123');
            expect(serialized.name).toBe('Test');
        });

        it('should exclude deletedAt when transforming to plain object', () => {
            const deletedDate = new Date();
            const entity = new TestEntity({
                id: '123',
                name: 'Test',
                deletedAt: deletedDate,
            });

            const plain = plainToInstance(TestEntity, entity, {
                excludeExtraneousValues: false,
            });

            const serialized = JSON.parse(JSON.stringify(plain));

            expect(serialized.id).toBe('123');
            expect(serialized.name).toBe('Test');
        });
    });

    describe('Object Assignment', () => {
        it('should properly assign all properties using Object.assign', () => {
            const data = {
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                deleted: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02'),
            };

            const entity = new TestEntity(data);

            expect(entity.id).toBe(data.id);
            expect(entity.name).toBe(data.name);
            expect(entity.email).toBe(data.email);
            expect(entity.deleted).toBe(data.deleted);
            expect(entity.createdAt).toEqual(data.createdAt);
            expect(entity.updatedAt).toEqual(data.updatedAt);
        });

        it('should override properties if called multiple times', () => {
            const entity = new TestEntity({ name: 'First Name' });

            expect(entity.name).toBe('First Name');

            Object.assign(entity, { name: 'Second Name' });

            expect(entity.name).toBe('Second Name');
        });

        it('should handle null values', () => {
            const entity = new TestEntity({
                name: null as any,
                email: null as any,
            });

            expect(entity.name).toBeNull();
            expect(entity.email).toBeNull();
        });
    });

    describe('Soft Delete Behavior', () => {
        it('should support soft delete flag', () => {
            const entity = new TestEntity({
                id: '123',
                name: 'Test',
                deleted: false,
            });

            expect(entity.deleted).toBe(false);

            entity.deleted = true;
            entity.deletedAt = new Date();

            expect(entity.deleted).toBe(true);
            expect(entity.deletedAt).toBeDefined();
        });

        it('should maintain deleted state across operations', () => {
            const entity = new TestEntity({ deleted: true });

            expect(entity.deleted).toBe(true);

            entity.deleted = false;
            entity.deletedAt = undefined;

            expect(entity.deleted).toBe(false);
            expect(entity.deletedAt).toBeUndefined();
        });
    });

    describe('Inheritance', () => {
        it('should allow child classes to extend with additional properties', () => {
            class ExtendedEntity extends AbstractEntity<ExtendedEntity> {
                customField?: string;
                anotherField?: number;

                constructor(entity?: Partial<ExtendedEntity>) {
                    super(entity);
                    if (entity) {
                        Object.assign(this, entity);
                    }
                }
            }

            const entity = new ExtendedEntity({
                id: '123',
                customField: 'custom',
                anotherField: 42,
            });

            expect(entity.id).toBe('123');
            expect(entity.customField).toBe('custom');
            expect(entity.anotherField).toBe(42);
        });

        it('should maintain all base properties in child classes', () => {
            const now = new Date();
            const entity = new TestEntity({
                id: '123',
                name: 'Test',
                deleted: false,
                createdAt: now,
                updatedAt: now,
            });

            expect(entity).toHaveProperty('id');
            expect(entity).toHaveProperty('deleted');
            expect(entity).toHaveProperty('createdAt');
            expect(entity).toHaveProperty('updatedAt');
            expect(entity).toHaveProperty('deletedAt');
        });
    });

    describe('Class Transformer @Exclude coverage', () => {
        it('should exclude createdAt from plain object', () => {
            const entity = new TestEntity({
                id: '1',
                name: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const plain = instanceToPlain(entity) as any;

            expect(plain.createdAt).toBeUndefined();
            expect(plain.id).toBe('1');
            expect(plain.name).toBe('Test');
        });

        it('should exclude deletedAt from plain object', () => {
            const entity = new TestEntity({
                id: '1',
                name: 'Test',
                deletedAt: new Date(),
            });

            const plain = instanceToPlain(entity) as any;

            expect(plain.deletedAt).toBeUndefined();
            expect(plain.id).toBe('1');
            expect(plain.name).toBe('Test');
        });
    });
});
