import { Test, TestingModule } from '@nestjs/testing';
import { UsersRelationsService } from './users-relations.service';

describe('UsersRelationsService', () => {
    let service: UsersRelationsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersRelationsService],
        }).compile();

        service = module.get<UsersRelationsService>(UsersRelationsService);
    });

    describe('getCurrentUserRelations', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should return an array of relations', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return correct relations for current user', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toEqual(['role', 'avatar', 'avatar.file', 'group', 'group.permissions']);
        });

        it('should return array with exactly 5 elements', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toHaveLength(5);
        });

        it('should include "role" relation', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toContain('role');
        });

        it('should include "avatar" relation', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toContain('avatar');
        });

        it('should include "avatar.file" relation', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toContain('avatar.file');
        });

        it('should include "group" relation', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toContain('group');
        });

        it('should include "group.permissions" relation', () => {
            const result = service.getCurrentUserRelations();

            expect(result).toContain('group.permissions');
        });

        it('should return the same result on multiple calls', () => {
            const firstCall = service.getCurrentUserRelations();
            const secondCall = service.getCurrentUserRelations();

            expect(firstCall).toEqual(secondCall);
        });

        it('should return relations in the correct order', () => {
            const result = service.getCurrentUserRelations();

            expect(result[0]).toBe('role');
            expect(result[1]).toBe('avatar');
            expect(result[2]).toBe('avatar.file');
            expect(result[3]).toBe('group');
            expect(result[4]).toBe('group.permissions');
        });
    });
});
