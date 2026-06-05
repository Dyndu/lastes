import { Test, TestingModule } from '@nestjs/testing';
import { SAdminConService } from './s-admin-con.service';
import { SupportsService } from './supports.service';
import { SAdminConEntity, SConEntity, SMessagesEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SAdminConService', () => {
    let service: SAdminConService;
    let sAdminConRepo: any;
    let sTransformService: any;

    const mockAdmin: UserEntity = {
        id: 'admin-123',
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'User',
    } as any;

    const mockConversation: SConEntity = {
        id: 'con-123',
        subject: 'Test Support',
    } as any;

    const mockMessage: SMessagesEntity = {
        id: 'msg-123',
        content: 'Test message',
    } as SMessagesEntity;

    const mockAdminCon: SAdminConEntity = {
        id: 'admin-con-123',
        admin: mockAdmin,
        conversation: mockConversation,
        lastReadMessage: mockMessage,
        deleted: false,
    } as SAdminConEntity;

    beforeEach(async () => {
        sAdminConRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
        };

        sTransformService = {
            adminConEntities: jest.fn(),
        };

        const mockSupportsService = {
            sAdminConRepo,
            sTransformService,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SAdminConService,
                {
                    provide: SupportsService,
                    useValue: mockSupportsService,
                },
            ],
        }).compile();

        service = module.get<SAdminConService>(SAdminConService);
        module.get(SupportsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildSAdminConEntity', () => {
        it('should build SAdminConEntity with required fields only', () => {
            const result = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {},
            );

            expect(result).toBeInstanceOf(SAdminConEntity);
            expect(result.admin).toEqual(mockAdmin);
            expect(result.conversation).toEqual(mockConversation);
            expect(result.lastReadMessage).toBeUndefined();
        });

        it('should build SAdminConEntity with required and optional fields', () => {
            const result = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {
                    lastReadMessage: mockMessage,
                },
            );

            expect(result).toBeInstanceOf(SAdminConEntity);
            expect(result.admin).toEqual(mockAdmin);
            expect(result.conversation).toEqual(mockConversation);
            expect(result.lastReadMessage).toEqual(mockMessage);
        });

        it('should build SAdminConEntity without lastReadMessage when not provided', () => {
            const result = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {
                    lastReadMessage: undefined,
                },
            );

            expect(result).toBeInstanceOf(SAdminConEntity);
            expect(result.admin).toEqual(mockAdmin);
            expect(result.conversation).toEqual(mockConversation);
            expect(result.lastReadMessage).toBeUndefined();
        });

        it('should use Object.assign to merge required and optional fields', () => {
            const result = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {
                    lastReadMessage: mockMessage,
                },
            );

            expect(result.admin).toBe(mockAdmin);
            expect(result.conversation).toBe(mockConversation);
            expect(result.lastReadMessage).toBe(mockMessage);
        });

        it('should create a new instance each time', () => {
            const result1 = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {},
            );

            const result2 = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {},
            );

            expect(result1).not.toBe(result2);
            expect(result1).toBeInstanceOf(SAdminConEntity);
            expect(result2).toBeInstanceOf(SAdminConEntity);
        });

        it('should handle different admin and conversation objects', () => {
            const differentAdmin = {
                id: 'admin-456',
                email: 'different@test.com',
            } as UserEntity;

            const differentCon = {
                id: 'con-456',
                subject: 'Different Support',
            } as any;

            const result = service.buildSAdminConEntity(
                {
                    admin: differentAdmin,
                    conversation: differentCon,
                },
                {},
            );

            expect(result.admin).toEqual(differentAdmin);
            expect(result.conversation).toEqual(differentCon);
        });

        it('should handle different lastReadMessage objects', () => {
            const differentMessage = {
                id: 'msg-456',
                content: 'Different message',
            } as SMessagesEntity;

            const result = service.buildSAdminConEntity(
                {
                    admin: mockAdmin,
                    conversation: mockConversation,
                },
                {
                    lastReadMessage: differentMessage,
                },
            );

            expect(result.lastReadMessage).toEqual(differentMessage);
        });
    });

    describe('associateAdminCon', () => {
        it('should return existing admin-conversation if it exists', async () => {
            sTransformService.adminConEntities.mockReturnValue([
                'admin',
                'conversation',
                'lastReadMessage',
            ]);
            sAdminConRepo.findOne.mockResolvedValue(mockAdminCon);

            const result = await service.associateAdminCon(mockAdmin, mockConversation);

            expect(sAdminConRepo.findOne).toHaveBeenCalledWith({
                where: {
                    admin: { id: mockAdmin.id },
                    conversation: { id: mockConversation.id },
                    deleted: false,
                },
                relations: ['admin', 'conversation', 'lastReadMessage'],
            });
            expect(sAdminConRepo.create).not.toHaveBeenCalled();
            expect(result).toEqual(mockAdminCon);
        });

        it('should create new admin-conversation if it does not exist', async () => {
            sTransformService.adminConEntities.mockReturnValue(['admin', 'conversation']);
            sAdminConRepo.findOne.mockResolvedValue(null);
            sAdminConRepo.create.mockResolvedValue(mockAdminCon);

            const result = await service.associateAdminCon(mockAdmin, mockConversation);

            expect(sAdminConRepo.findOne).toHaveBeenCalledWith({
                where: {
                    admin: { id: mockAdmin.id },
                    conversation: { id: mockConversation.id },
                    deleted: false,
                },
                relations: ['admin', 'conversation'],
            });
            expect(sAdminConRepo.create).toHaveBeenCalled();

            const createdEntity = sAdminConRepo.create.mock.calls[0][0];
            expect(createdEntity).toBeInstanceOf(SAdminConEntity);
            expect(createdEntity.admin).toEqual(mockAdmin);
            expect(createdEntity.conversation).toEqual(mockConversation);
            expect(result).toEqual(mockAdminCon);
        });

        it('should create admin-conversation with lastReadMessage when provided', async () => {
            sTransformService.adminConEntities.mockReturnValue([
                'admin',
                'conversation',
                'lastReadMessage',
            ]);
            sAdminConRepo.findOne.mockResolvedValue(null);
            sAdminConRepo.create.mockResolvedValue(mockAdminCon);

            const result = await service.associateAdminCon(
                mockAdmin,
                mockConversation,
                mockMessage,
            );

            expect(sAdminConRepo.create).toHaveBeenCalled();

            const createdEntity = sAdminConRepo.create.mock.calls[0][0];
            expect(createdEntity.admin).toEqual(mockAdmin);
            expect(createdEntity.conversation).toEqual(mockConversation);
            expect(createdEntity.lastReadMessage).toEqual(mockMessage);
            expect(result).toEqual(mockAdminCon);
        });

        it('should create admin-conversation without lastReadMessage when not provided', async () => {
            sTransformService.adminConEntities.mockReturnValue(['admin', 'conversation']);
            sAdminConRepo.findOne.mockResolvedValue(null);
            sAdminConRepo.create.mockResolvedValue({
                ...mockAdminCon,
                lastReadMessage: undefined,
            });

            const result = await service.associateAdminCon(mockAdmin, mockConversation);

            expect(sAdminConRepo.create).toHaveBeenCalled();

            const createdEntity = sAdminConRepo.create.mock.calls[0][0];
            expect(createdEntity.admin).toEqual(mockAdmin);
            expect(createdEntity.conversation).toEqual(mockConversation);
            expect(createdEntity.lastReadMessage).toBeUndefined();
            expect(result.lastReadMessage).toBeUndefined();
        });

        it('should query with correct admin and conversation IDs', async () => {
            const specificAdmin = {
                id: 'specific-admin-id',
                email: 'specific@test.com',
            } as UserEntity;

            const specificCon = {
                id: 'specific-con-id',
                subject: 'Specific Support',
            } as any;

            sTransformService.adminConEntities.mockReturnValue(['admin']);
            sAdminConRepo.findOne.mockResolvedValue(null);
            sAdminConRepo.create.mockResolvedValue({} as SAdminConEntity);

            await service.associateAdminCon(specificAdmin, specificCon);

            expect(sAdminConRepo.findOne).toHaveBeenCalledWith({
                where: {
                    admin: { id: 'specific-admin-id' },
                    conversation: { id: 'specific-con-id' },
                    deleted: false,
                },
                relations: ['admin'],
            });
        });

        it('should always query for non-deleted admin-conversations', async () => {
            sTransformService.adminConEntities.mockReturnValue([]);
            sAdminConRepo.findOne.mockResolvedValue(mockAdminCon);

            await service.associateAdminCon(mockAdmin, mockConversation);

            expect(sAdminConRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deleted: false,
                    }),
                }),
            );
        });

        it('should use adminConEntities() to get relations', async () => {
            const customRelations = ['admin', 'conversation', 'customRelation'];
            sTransformService.adminConEntities.mockReturnValue(customRelations);
            sAdminConRepo.findOne.mockResolvedValue(mockAdminCon);

            await service.associateAdminCon(mockAdmin, mockConversation);

            expect(sTransformService.adminConEntities).toHaveBeenCalled();
            expect(sAdminConRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    relations: customRelations,
                }),
            );
        });

        it('should handle undefined lastReadMessage parameter', async () => {
            sTransformService.adminConEntities.mockReturnValue(['admin']);
            sAdminConRepo.findOne.mockResolvedValue(null);
            sAdminConRepo.create.mockResolvedValue(mockAdminCon);

            await service.associateAdminCon(mockAdmin, mockConversation, undefined);

            const createdEntity = sAdminConRepo.create.mock.calls[0][0];
            expect(createdEntity.lastReadMessage).toBeUndefined();
        });

        it('should return existing admin-conversation even if lastReadMessage is provided', async () => {
            sTransformService.adminConEntities.mockReturnValue(['admin']);
            sAdminConRepo.findOne.mockResolvedValue(mockAdminCon);

            const result = await service.associateAdminCon(
                mockAdmin,
                mockConversation,
                mockMessage,
            );

            expect(result).toEqual(mockAdminCon);
            expect(sAdminConRepo.create).not.toHaveBeenCalled();
        });

        it('should call buildSAdminConEntity when creating new association', async () => {
            sTransformService.adminConEntities.mockReturnValue(['admin']);
            sAdminConRepo.findOne.mockResolvedValue(null);
            sAdminConRepo.create.mockImplementation((entity: any) => Promise.resolve(entity));

            const buildSpy = jest.spyOn(service, 'buildSAdminConEntity');

            await service.associateAdminCon(mockAdmin, mockConversation, mockMessage);

            expect(buildSpy).toHaveBeenCalledWith(
                { admin: mockAdmin, conversation: mockConversation },
                { lastReadMessage: mockMessage },
            );
        });

        it('should handle when findOne returns undefined', async () => {
            sTransformService.adminConEntities.mockReturnValue(['admin']);
            sAdminConRepo.findOne.mockResolvedValue(undefined);
            sAdminConRepo.create.mockResolvedValue(mockAdminCon);

            const result = await service.associateAdminCon(mockAdmin, mockConversation);

            expect(sAdminConRepo.create).toHaveBeenCalled();
            expect(result).toEqual(mockAdminCon);
        });
    });
});
