import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NewslettersRepository } from './newsletters.repository';
import { NewsletterEntity } from './entities/newsletter.entity';

describe('NewslettersRepository', () => {
    let newLetterRepository: NewslettersRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NewslettersRepository,
                {
                    provide: getRepositoryToken(NewsletterEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        newLetterRepository = module.get<NewslettersRepository>(NewslettersRepository);
    });

    it('should be defined', () => {
        expect(newLetterRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(newLetterRepository['logger']).toBeDefined();
    });
});
