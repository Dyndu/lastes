import { EntityManager, Repository, In } from 'typeorm';
import { AbstractRepository } from './abstract.repository';
import { AbstractEntity } from './abstract.entity';

class TestEntity extends AbstractEntity<TestEntity> {
    name: string;
    email: string;
}

class TestRepository extends AbstractRepository<TestEntity> {
    constructor(repository: Repository<TestEntity>, entityManager: EntityManager) {
        super(repository, entityManager);
    }
}

describe('AbstractRepository Full Coverage', () => {
    let repository: TestRepository;
    let mockEntityRepository: jest.Mocked<Repository<TestEntity>>;
    let mockEntityManager: jest.Mocked<EntityManager>;

    beforeEach(() => {
        mockEntityRepository = {
            count: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
        } as any;

        mockEntityManager = {
            save: jest.fn(),
        } as any;

        repository = new TestRepository(mockEntityRepository, mockEntityManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRepository', () => {
        it('should return the underlying repository instance', () => {
            expect(repository.getRepository()).toBe(mockEntityRepository);
        });

        it('repository should have basic methods', () => {
            const repo = repository.getRepository();
            expect(repo).toHaveProperty('count');
            expect(repo).toHaveProperty('find');
            expect(repo).toHaveProperty('findOne');
            expect(repo).toHaveProperty('update');
            expect(repo).toHaveProperty('delete');
        });
    });

    describe('count', () => {
        it('should return the count of entities', async () => {
            const options = { where: { deleted: false } };
            mockEntityRepository.count.mockResolvedValue(5);
            const result = await repository.count(options);
            expect(result).toBe(5);
            expect(mockEntityRepository.count).toHaveBeenCalledWith(options);
        });
    });

    describe('find', () => {
        it('should return entities array', async () => {
            const mockEntities = [
                { id: '1', name: 'Test 1' },
                { id: '2', name: 'Test 2' },
            ] as TestEntity[];
            const options = { where: { deleted: false } };
            mockEntityRepository.find.mockResolvedValue(mockEntities);
            const result = await repository.find(options);
            expect(result).toEqual(mockEntities);
        });
    });

    describe('findAndCount', () => {
        it('should return entities and count', async () => {
            const mockEntities = [
                { id: '1', name: 'Test 1' },
                { id: '2', name: 'Test 2' },
            ] as TestEntity[];
            const mockResult: [TestEntity[], number] = [mockEntities, 2];
            const options = { where: { deleted: false } };
            mockEntityRepository.findAndCount.mockResolvedValue(mockResult);
            const result = await repository.findAndCount(options);
            expect(result).toEqual(mockResult);
        });
    });

    describe('findOne', () => {
        it('should return a single entities', async () => {
            const mockEntity = { id: '1', name: 'Test 1' } as TestEntity;
            const options = { where: { id: '1' } };
            mockEntityRepository.findOne.mockResolvedValue(mockEntity);
            const result = await repository.findOne(options);
            expect(result).toEqual(mockEntity);
        });

        it('should return null if not found', async () => {
            mockEntityRepository.findOne.mockResolvedValue(null);
            const result = await repository.findOne({ where: { id: '0' } });
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create entities', async () => {
            const entity = { name: 'New', email: 'a@b.com' } as TestEntity;
            const saved = { ...entity, id: '1' } as TestEntity;
            mockEntityManager.save.mockResolvedValue(saved);
            const result = await repository.create(entity);
            expect(result).toEqual(saved);
        });

        it('should throw if save fails', async () => {
            const entity = { name: 'Fail' } as TestEntity;
            mockEntityManager.save.mockRejectedValue(new Error('DB error'));
            await expect(repository.create(entity)).rejects.toThrow('DB error');
        });
    });

    describe('createMany', () => {
        it('should create multiple entities', async () => {
            const entities = [
                { name: '1', email: '1@a.com' },
                { name: '2', email: '2@a.com' },
            ] as TestEntity[];
            const saved = entities.map((e, i) => ({ ...e, id: `${i + 1}` }) as TestEntity);
            mockEntityManager.save.mockResolvedValue(saved);
            const result = await repository.createMany(entities);
            expect(result).toEqual(saved);
        });

        it('should throw if save fails', async () => {
            const entities = [{ name: 'Fail' }] as TestEntity[];
            mockEntityManager.save.mockRejectedValue(new Error('DB error'));
            await expect(repository.createMany(entities)).rejects.toThrow('DB error');
        });
    });

    describe('update', () => {
        it('should update entities and return updated', async () => {
            const where = { id: '1' };
            const partial = { name: 'Updated' };
            const updatedEntity = { id: '1', name: 'Updated' } as TestEntity;
            mockEntityRepository.update.mockResolvedValue({
                affected: 1,
            } as any);
            mockEntityRepository.findOne.mockResolvedValue(updatedEntity);
            const result = await repository.update(where, partial);
            expect(result).toEqual(updatedEntity);
        });

        it('should throw if entities not found after update', async () => {
            const where = { id: '1' };
            const partial = { name: 'Updated' };
            mockEntityRepository.update.mockResolvedValue({
                affected: 1,
            } as any);
            mockEntityRepository.findOne.mockResolvedValue(null);
            await expect(repository.update(where, partial)).rejects.toThrow(
                'Entity not found after update',
            );
        });
    });

    describe('delete', () => {
        it('should delete entities', async () => {
            const where = { id: '1' };
            mockEntityRepository.delete.mockResolvedValue({
                affected: 1,
            } as any);
            await repository.delete(where);
            expect(mockEntityRepository.delete).toHaveBeenCalledWith(where);
        });
    });

    describe('softDelete', () => {
        it('should soft delete entities and mark deleted', async () => {
            const where = { id: '1' };
            mockEntityRepository.softDelete.mockResolvedValue({
                affected: 1,
            } as any);
            mockEntityRepository.update.mockResolvedValue({
                affected: 1,
            } as any);
            await repository.softDelete(where);
            expect(mockEntityRepository.softDelete).toHaveBeenCalledWith(where);
            expect(mockEntityRepository.update).toHaveBeenCalledWith(where, {
                deleted: true,
            });
        });

        it('should still call update if affected=0', async () => {
            const where = { id: '1' };
            mockEntityRepository.softDelete.mockResolvedValue({
                affected: 0,
            } as any);
            mockEntityRepository.update.mockResolvedValue({
                affected: 0,
            } as any);
            await repository.softDelete(where);
            expect(mockEntityRepository.update).toHaveBeenCalledWith(where, {
                deleted: true,
            });
        });
    });

    describe('restore', () => {
        it('should restore soft deleted entities', async () => {
            const where = { id: '1' };
            mockEntityRepository.restore.mockResolvedValue({
                affected: 1,
            } as any);
            mockEntityRepository.update.mockResolvedValue({
                affected: 1,
            } as any);
            await repository.restore(where);
            expect(mockEntityRepository.restore).toHaveBeenCalledWith(where);
            expect(mockEntityRepository.update).toHaveBeenCalledWith(where, {
                deleted: false,
            });
        });

        it('should still call update if affected=0', async () => {
            const where = { id: '1' };
            mockEntityRepository.restore.mockResolvedValue({
                affected: 0,
            } as any);
            mockEntityRepository.update.mockResolvedValue({
                affected: 0,
            } as any);
            await repository.restore(where);
            expect(mockEntityRepository.update).toHaveBeenCalledWith(where, {
                deleted: false,
            });
        });
    });

    describe('assertUniqueActive', () => {
        it('should add error if active entities exists', async () => {
            const error: Record<string, string> = {};
            const criteria = { email: 'a@b.com' };
            mockEntityRepository.findOne.mockResolvedValue({ id: '1' } as any);
            await repository.assertUniqueActive(mockEntityRepository, error, criteria, 'User');
            expect(error.email).toContain('already exists');
        });

        it('should ignore excluded id', async () => {
            const error: Record<string, string> = {};
            const criteria = { email: 'a@b.com' };
            mockEntityRepository.findOne.mockResolvedValue(null);
            await repository.assertUniqueActive(mockEntityRepository, error, criteria, 'User', '1');
            expect(error).toEqual({});
        });

        it('should handle empty criteria gracefully', async () => {
            const error: Record<string, string> = {};
            const criteria = {};
            mockEntityRepository.findOne.mockResolvedValue(null);
            await repository.assertUniqueActive(mockEntityRepository, error, criteria, 'User');
            expect(error).toEqual({});
        });
    });

    describe('findActiveOne', () => {
        it('should return entities if found', async () => {
            const entity = { id: '1', deleted: false } as TestEntity;
            mockEntityRepository.findOne.mockResolvedValue(entity);
            const result = await repository.findActiveOne(mockEntityRepository, { id: '1' }, [
                'profile',
            ]);
            expect(result).toBe(entity);
        });

        it('should return null if not found', async () => {
            mockEntityRepository.findOne.mockResolvedValue(null);
            const result = await repository.findActiveOne(mockEntityRepository, { id: '999' });
            expect(result).toBeNull();
        });
    });

    describe('findActiveMany', () => {
        it('should return entities if found', async () => {
            const entities = [
                { id: '1', deleted: false },
                { id: '2', deleted: false },
            ] as TestEntity[];
            mockEntityRepository.find.mockResolvedValue(entities);
            const result = await repository.findActiveMany(
                mockEntityRepository,
                { id: In(['1', '2']) },
                ['profile'],
            );
            expect(result).toEqual(entities);
        });

        it('should return empty array if none found', async () => {
            mockEntityRepository.find.mockResolvedValue([]);
            const result = await repository.findActiveMany(mockEntityRepository, { id: In([]) });
            expect(result).toEqual([]);
        });
    });
});
