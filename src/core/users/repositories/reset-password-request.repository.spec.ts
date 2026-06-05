import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResetPasswordRequestRepository } from './reset-password-request.repository';
import { ResetPasswordRequestEntity } from '../entities/reset-password-request.entity';

describe('ResetPasswordRequestRepository', () => {
    let repository: ResetPasswordRequestRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResetPasswordRequestRepository,
                {
                    provide: getRepositoryToken(ResetPasswordRequestEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        repository = module.get<ResetPasswordRequestRepository>(ResetPasswordRequestRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(repository['logger']).toBeDefined();
    });
});
