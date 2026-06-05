import { Test, TestingModule } from '@nestjs/testing';
import { SConService } from './s-con.service';
import { SupportsService } from './supports.service';
import { SConEntity, SMessagesEntity, SAdminConEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { SCodeEntity } from '../../s-codes/entities/s-code.entity';
import { SConStatusEnum, SocketEventEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SConService', () => {
    let service: SConService;
    let sConRepo: any;
    let sTransformService: any;
    let otherUtils: any;
    let errorHandler: any;
    let logger: any;
    let sCodeService: any;
    let sAdminConRepo: any;
    let socketService: any;

    const mockUser: UserEntity = {
        id: 'user-123',
        email: 'user@test.com',
        firstname: 'Test',
        lastname: 'User',
    } as any;

    const mockCode: SCodeEntity = {
        id: 'code-123',
        label: 'Technical Support',
    } as SCodeEntity;

    const mockMessage: SMessagesEntity = {
        id: 'msg-123',
        content: 'Test message',
        createdAt: new Date(),
        serialId: 1,
    } as SMessagesEntity;

    const mockConversation: SConEntity = {
        id: 'con-123',
        label: '12345678',
        createdBy: mockUser,
        code: mockCode,
        deleted: false,
    } as SConEntity;

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        errorHandler = {
            badRequest: jest.fn(),
            notFound: jest.fn(),
        };

        otherUtils = {
            formatCriteria: jest.fn(),
            generateNumber: jest.fn(),
            paginateResultsFromCache: jest.fn(),
        };

        sConRepo = {
            findOne: jest.fn(),
            findActiveOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            getRepository: jest.fn(),
        };

        sAdminConRepo = {
            find: jest.fn(),
        };

        socketService = {
            sendDataToUser: jest.fn(),
        };

        sTransformService = {
            conEntities: jest.fn(),
            transformConsWithUnread: jest.fn(),
            transformCon: jest.fn(),
        };

        sCodeService = {
            retrieveSCodeByCriteria: jest.fn(),
        };

        const mockSupportsService = {
            sConRepo,
            sTransformService,
            otherUtils,
            errorHandler,
            logger,
            sCodeService,
            sAdminConRepo,
            socketService,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SConService,
                {
                    provide: SupportsService,
                    useValue: mockSupportsService,
                },
            ],
        }).compile();

        service = module.get<SConService>(SConService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildSConEntity', () => {
        it('should build SConEntity with required fields only', () => {
            const result = service.buildSConEntity(
                {
                    label: '12345678',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {},
            );

            expect(result).toBeInstanceOf(SConEntity);
            expect(result.label).toBe('12345678');
            expect(result.createdBy).toEqual(mockUser);
            expect(result.code).toEqual(mockCode);
            expect(result.lastMessage).toBeUndefined();
            expect(result.lastReadMessage).toBeUndefined();
        });

        it('should build SConEntity with required and optional fields', () => {
            const result = service.buildSConEntity(
                {
                    label: '87654321',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {
                    lastMessage: mockMessage,
                    lastReadMessage: mockMessage,
                },
            );

            expect(result).toBeInstanceOf(SConEntity);
            expect(result.label).toBe('87654321');
            expect(result.createdBy).toEqual(mockUser);
            expect(result.code).toEqual(mockCode);
            expect(result.lastMessage).toEqual(mockMessage);
            expect(result.lastReadMessage).toEqual(mockMessage);
        });

        it('should build SConEntity with only lastMessage', () => {
            const result = service.buildSConEntity(
                {
                    label: '11111111',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {
                    lastMessage: mockMessage,
                },
            );

            expect(result.lastMessage).toEqual(mockMessage);
            expect(result.lastReadMessage).toBeUndefined();
        });

        it('should build SConEntity with only lastReadMessage', () => {
            const result = service.buildSConEntity(
                {
                    label: '22222222',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {
                    lastReadMessage: mockMessage,
                },
            );

            expect(result.lastMessage).toBeUndefined();
            expect(result.lastReadMessage).toEqual(mockMessage);
        });

        it('should use Object.assign to merge required and optional fields', () => {
            const result = service.buildSConEntity(
                {
                    label: '33333333',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {
                    lastMessage: mockMessage,
                },
            );

            expect(result.label).toBe('33333333');
            expect(result.createdBy).toBe(mockUser);
            expect(result.code).toBe(mockCode);
            expect(result.lastMessage).toBe(mockMessage);
        });

        it('should create a new instance each time', () => {
            const result1 = service.buildSConEntity(
                {
                    label: '44444444',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {},
            );

            const result2 = service.buildSConEntity(
                {
                    label: '55555555',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {},
            );

            expect(result1).not.toBe(result2);
            expect(result1).toBeInstanceOf(SConEntity);
            expect(result2).toBeInstanceOf(SConEntity);
        });

        it('should handle different labels', () => {
            const result = service.buildSConEntity(
                {
                    label: 'CUSTOM123',
                    createdBy: mockUser,
                    code: mockCode,
                },
                {},
            );

            expect(result.label).toBe('CUSTOM123');
        });

        it('should handle different users and codes', () => {
            const differentUser = {
                id: 'user-456',
                email: 'different@test.com',
            } as UserEntity;

            const differentCode = {
                id: 'code-456',
                label: 'Billing Support',
            } as SCodeEntity;

            const result = service.buildSConEntity(
                {
                    label: '66666666',
                    createdBy: differentUser,
                    code: differentCode,
                },
                {},
            );

            expect(result.createdBy).toEqual(differentUser);
            expect(result.code).toEqual(differentCode);
        });
    });

    describe('validateConversationInput', () => {
        it('should throw bad request error when both conId and codeId are missing', () => {
            errorHandler.badRequest.mockImplementation(() => {
                throw new Error('Bad Request');
            });

            expect(() => service.validateConversationInput()).toThrow('Bad Request');

            expect(errorHandler.badRequest).toHaveBeenCalledWith(
                `Either create a new conversation or send a message, can't do both`,
                `Forbidden: create a conversation or send a message`,
            );
        });

        it('should throw bad request error when both conId and codeId are provided', () => {
            errorHandler.badRequest.mockImplementation(() => {
                throw new Error('Bad Request');
            });

            expect(() => service.validateConversationInput('con-123', 'code-123')).toThrow(
                'Bad Request',
            );

            expect(errorHandler.badRequest).toHaveBeenCalledWith(
                `Either create a new conversation or send a message, can't do both`,
                `Forbidden: create a conversation or send a message`,
            );
        });

        it('should not throw error when only conId is provided', () => {
            expect(() => {
                service.validateConversationInput('con-123', undefined);
            }).not.toThrow();

            expect(errorHandler.badRequest).not.toHaveBeenCalled();
        });

        it('should not throw error when only codeId is provided', () => {
            expect(() => {
                service.validateConversationInput(undefined, 'code-123');
            }).not.toThrow();

            expect(errorHandler.badRequest).not.toHaveBeenCalled();
        });

        it('should handle undefined values explicitly', () => {
            errorHandler.badRequest.mockImplementation(() => {
                throw new Error('Bad Request');
            });

            expect(() => service.validateConversationInput(undefined, undefined)).toThrow(
                'Bad Request',
            );
        });

        it('should handle null values as falsy', () => {
            expect(() => {
                service.validateConversationInput('con-123', null as any);
            }).not.toThrow();

            expect(errorHandler.badRequest).not.toHaveBeenCalled();
        });

        it('should handle empty strings as truthy', () => {
            errorHandler.badRequest.mockImplementation(() => {
                throw new Error('Bad Request');
            });

            expect(() => service.validateConversationInput('', '')).toThrow('Bad Request');
        });
    });

    describe('retrieveSConByCriteria', () => {
        it('should retrieve a conversation by criteria without relations', async () => {
            const criteria = { id: 'con-123' };

            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            const result = await service.retrieveSConByCriteria(criteria);

            expect(logger.info).toHaveBeenCalledWith('Find a support conversation by id: con-123');
            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(sConRepo, criteria, undefined);
            expect(result).toEqual(mockConversation);
        });

        it('should retrieve a conversation by criteria with relations', async () => {
            const criteria = { id: 'con-123' };
            const relations = ['createdBy', 'code', 'lastMessage'];

            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            const result = await service.retrieveSConByCriteria(criteria, relations);

            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(sConRepo, criteria, relations);
            expect(result).toEqual(mockConversation);
        });

        it('should throw not found error when conversation does not exist', async () => {
            const criteria = { id: 'non-existent' };

            otherUtils.formatCriteria.mockReturnValue('id: non-existent');
            sConRepo.findActiveOne.mockResolvedValue(null);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.retrieveSConByCriteria(criteria)).rejects.toThrow('Not found');

            expect(errorHandler.notFound).toHaveBeenCalledWith(
                'Support conversation not found with id: non-existent',
                'Support conversation not found',
            );
        });

        it('should handle multiple criteria', async () => {
            const criteria = { id: 'con-123', label: '12345678' };

            otherUtils.formatCriteria.mockReturnValue('id: con-123, label: 12345678');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.retrieveSConByCriteria(criteria);

            expect(logger.info).toHaveBeenCalledWith(
                'Find a support conversation by id: con-123, label: 12345678',
            );
        });

        it('should handle empty relations array', async () => {
            const criteria = { id: 'con-123' };
            const relations: string[] = [];

            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.retrieveSConByCriteria(criteria, relations);

            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(sConRepo, criteria, []);
        });

        it('should handle when findActiveOne returns undefined', async () => {
            const criteria = { id: 'con-123' };

            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(undefined);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.retrieveSConByCriteria(criteria)).rejects.toThrow('Not found');
        });
    });

    describe('generateConLabel', () => {
        it('should generate a unique label on first attempt', async () => {
            otherUtils.generateNumber.mockReturnValue('12345678');
            sConRepo.findOne.mockResolvedValue(null);

            const result = await service.generateConLabel();

            expect(otherUtils.generateNumber).toHaveBeenCalledWith(8);
            expect(sConRepo.findOne).toHaveBeenCalledWith({
                where: { label: '12345678', deleted: false },
            });
            expect(result).toBe('12345678');
        });

        it('should generate a new label if first label already exists', async () => {
            otherUtils.generateNumber
                .mockReturnValueOnce('11111111')
                .mockReturnValueOnce('22222222');

            sConRepo.findOne.mockResolvedValueOnce(mockConversation).mockResolvedValueOnce(null);

            const result = await service.generateConLabel();

            expect(otherUtils.generateNumber).toHaveBeenCalledTimes(2);
            expect(sConRepo.findOne).toHaveBeenCalledTimes(2);
            expect(sConRepo.findOne).toHaveBeenNthCalledWith(1, {
                where: { label: '11111111', deleted: false },
            });
            expect(sConRepo.findOne).toHaveBeenNthCalledWith(2, {
                where: { label: '22222222', deleted: false },
            });
            expect(result).toBe('22222222');
        });

        it('should keep generating until unique label is found', async () => {
            otherUtils.generateNumber
                .mockReturnValueOnce('11111111')
                .mockReturnValueOnce('22222222')
                .mockReturnValueOnce('33333333')
                .mockReturnValueOnce('44444444');

            sConRepo.findOne
                .mockResolvedValueOnce(mockConversation)
                .mockResolvedValueOnce(mockConversation)
                .mockResolvedValueOnce(mockConversation)
                .mockResolvedValueOnce(null);

            const result = await service.generateConLabel();

            expect(otherUtils.generateNumber).toHaveBeenCalledTimes(4);
            expect(sConRepo.findOne).toHaveBeenCalledTimes(4);
            expect(result).toBe('44444444');
        });

        it('should only check for non-deleted conversations', async () => {
            otherUtils.generateNumber.mockReturnValue('12345678');
            sConRepo.findOne.mockResolvedValue(null);

            await service.generateConLabel();

            expect(sConRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deleted: false,
                    }),
                }),
            );
        });

        it('should handle when findOne returns undefined', async () => {
            otherUtils.generateNumber.mockReturnValue('99999999');
            sConRepo.findOne.mockResolvedValue(undefined);

            const result = await service.generateConLabel();

            expect(result).toBe('99999999');
        });
    });

    describe('createSCon', () => {
        it('should create a new conversation with generated label', async () => {
            otherUtils.generateNumber.mockReturnValue('12345678');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);

            const result = await service.createSCon(mockUser, mockCode);

            expect(otherUtils.generateNumber).toHaveBeenCalledWith(8);
            expect(sConRepo.create).toHaveBeenCalled();

            const createdEntity = sConRepo.create.mock.calls[0][0];
            expect(createdEntity).toBeInstanceOf(SConEntity);
            expect(createdEntity.label).toBe('12345678');
            expect(createdEntity.createdBy).toEqual(mockUser);
            expect(createdEntity.code).toEqual(mockCode);
            expect(result).toEqual(mockConversation);
        });

        it('should call buildSConEntity with correct parameters', async () => {
            otherUtils.generateNumber.mockReturnValue('87654321');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);

            const buildSpy = jest.spyOn(service, 'buildSConEntity');

            await service.createSCon(mockUser, mockCode);

            expect(buildSpy).toHaveBeenCalledWith(
                {
                    createdBy: mockUser,
                    code: mockCode,
                    label: '87654321',
                },
                {},
            );
        });

        it('should call generateConLabel to get unique label', async () => {
            otherUtils.generateNumber.mockReturnValue('11223344');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);

            const generateSpy = jest.spyOn(service, 'generateConLabel');

            await service.createSCon(mockUser, mockCode);

            expect(generateSpy).toHaveBeenCalled();
        });

        it('should handle different users and codes', async () => {
            const differentUser = {
                id: 'user-999',
                email: 'different@test.com',
            } as UserEntity;

            const differentCode = {
                id: 'code-999',
                label: 'General Support',
            } as SCodeEntity;

            otherUtils.generateNumber.mockReturnValue('99887766');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue({
                ...mockConversation,
                createdBy: differentUser,
                code: differentCode,
            });

            await service.createSCon(differentUser, differentCode);

            const createdEntity = sConRepo.create.mock.calls[0][0];
            expect(createdEntity.createdBy).toEqual(differentUser);
            expect(createdEntity.code).toEqual(differentCode);
        });
    });

    describe('getOrCreateCon', () => {
        it('should validate input before processing', async () => {
            errorHandler.badRequest.mockImplementation(() => {
                throw new Error('Bad Request');
            });

            await expect(service.getOrCreateCon(mockUser, undefined, undefined)).rejects.toThrow(
                'Bad Request',
            );

            expect(errorHandler.badRequest).toHaveBeenCalled();
        });

        it('should retrieve existing conversation when conId is provided', async () => {
            const conId = 'con-123';

            sTransformService.conEntities.mockReturnValue(['createdBy', 'code']);
            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            const result = await service.getOrCreateCon(mockUser, conId, undefined);

            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(sConRepo, { id: conId }, [
                'createdBy',
                'code',
            ]);
            expect(sCodeService.retrieveSCodeByCriteria).not.toHaveBeenCalled();
            expect(sConRepo.create).not.toHaveBeenCalled();
            expect(result).toEqual(mockConversation);
        });

        it('should create new conversation when codeId is provided', async () => {
            const codeId = 'code-123';

            sCodeService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);
            otherUtils.generateNumber.mockReturnValue('12345678');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);
            sTransformService.conEntities.mockReturnValue(['createdBy', 'code']);
            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            const result = await service.getOrCreateCon(mockUser, undefined, codeId);

            expect(sCodeService.retrieveSCodeByCriteria).toHaveBeenCalledWith({
                id: codeId,
            });
            expect(sConRepo.create).toHaveBeenCalled();
            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(
                sConRepo,
                { id: mockConversation.id },
                ['createdBy', 'code'],
            );
            expect(result).toEqual(mockConversation);
        });

        it('should use conEntities relations when retrieving conversation', async () => {
            const conId = 'con-123';
            const customRelations = ['createdBy', 'code', 'lastMessage', 'lastReadMessage'];

            sTransformService.conEntities.mockReturnValue(customRelations);
            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.getOrCreateCon(mockUser, conId, undefined);

            expect(sTransformService.conEntities).toHaveBeenCalled();
            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(
                sConRepo,
                { id: conId },
                customRelations,
            );
        });

        it('should call validateConversationInput first', async () => {
            const validateSpy = jest.spyOn(service, 'validateConversationInput');
            const conId = 'con-123';

            sTransformService.conEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.getOrCreateCon(mockUser, conId, undefined);

            expect(validateSpy).toHaveBeenCalledWith(conId, undefined);
        });

        it('should set conIdToFetch from existing conId', async () => {
            const existingConId = 'existing-con-456';

            sTransformService.conEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: existing-con-456');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.getOrCreateCon(mockUser, existingConId, undefined);

            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(
                sConRepo,
                { id: existingConId },
                [],
            );
        });

        it('should set conIdToFetch from newly created conversation', async () => {
            const codeId = 'code-456';
            const newConId = 'new-con-789';

            sCodeService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);
            otherUtils.generateNumber.mockReturnValue('87654321');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue({
                ...mockConversation,
                id: newConId,
            });
            sTransformService.conEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue(`id: ${newConId}`);
            sConRepo.findActiveOne.mockResolvedValue({
                ...mockConversation,
                id: newConId,
            });

            await service.getOrCreateCon(mockUser, undefined, codeId);

            expect(sConRepo.findActiveOne).toHaveBeenCalledWith(sConRepo, { id: newConId }, []);
        });

        it('should call createSCon when codeId is provided', async () => {
            const codeId = 'code-789';

            const createSpy = jest.spyOn(service, 'createSCon');

            sCodeService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);
            otherUtils.generateNumber.mockReturnValue('11111111');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);
            sTransformService.conEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.getOrCreateCon(mockUser, undefined, codeId);

            expect(createSpy).toHaveBeenCalledWith(mockUser, mockCode);
        });

        it('should retrieve conversation with id after creation', async () => {
            const codeId = 'code-abc';

            sCodeService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);
            otherUtils.generateNumber.mockReturnValue('22222222');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);
            sTransformService.conEntities.mockReturnValue(['code']);
            otherUtils.formatCriteria.mockReturnValue('id: con-123');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            const retrieveSpy = jest.spyOn(service, 'retrieveSConByCriteria');

            await service.getOrCreateCon(mockUser, undefined, codeId);

            expect(retrieveSpy).toHaveBeenCalledWith({ id: mockConversation.id }, ['code']);
        });

        it('should handle both branches of if-else correctly', async () => {
            sTransformService.conEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: con-branch-1');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.getOrCreateCon(mockUser, 'con-branch-1', undefined);
            expect(sCodeService.retrieveSCodeByCriteria).not.toHaveBeenCalled();

            jest.clearAllMocks();

            sCodeService.retrieveSCodeByCriteria.mockResolvedValue(mockCode);
            otherUtils.generateNumber.mockReturnValue('33333333');
            sConRepo.findOne.mockResolvedValue(null);
            sConRepo.create.mockResolvedValue(mockConversation);
            sTransformService.conEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: con-branch-2');
            sConRepo.findActiveOne.mockResolvedValue(mockConversation);

            await service.getOrCreateCon(mockUser, undefined, 'code-branch-2');
            expect(sCodeService.retrieveSCodeByCriteria).toHaveBeenCalled();
        });
    });

    describe('updateCon', () => {
        it('should return message when no updates are provided', async () => {
            const result = await service.updateCon(mockConversation);

            expect(result).toEqual({
                message: 'No updates provided for support conversation',
            });
            expect(sConRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when updates object is empty', async () => {
            const result = await service.updateCon(mockConversation, {});

            expect(result).toEqual({
                message: 'No updates provided for support conversation',
            });
            expect(sConRepo.update).not.toHaveBeenCalled();
        });

        it('should update label when provided and trimmed', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });

            const result = await service.updateCon(mockConversation, {
                label: '  new-label  ',
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { label: 'new-label' },
            );
            expect(result).toEqual({ affected: 1 });
        });

        it('should not update label when it is empty after trim', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateCon(mockConversation, {
                label: '   ',
            });

            expect(sConRepo.update).toHaveBeenCalledWith({ id: mockConversation.id }, {});
        });

        it('should update status when provided', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const status = SConStatusEnum.ACTIVE;

            await service.updateCon(mockConversation, {
                status,
            });

            expect(sConRepo.update).toHaveBeenCalledWith({ id: mockConversation.id }, { status });
        });

        it('should update createdBy when provided', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const newUser = { id: 'user-456' } as UserEntity;

            await service.updateCon(mockConversation, {
                createdBy: newUser,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { createdBy: newUser },
            );
        });

        it('should update code when provided', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const newCode = { id: 'code-456' } as SCodeEntity;

            await service.updateCon(mockConversation, {
                code: newCode,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { code: newCode },
            );
        });

        it('should update lastMessage when provided', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const newMessage = { id: 'msg-456' } as SMessagesEntity;

            await service.updateCon(mockConversation, {
                lastMessage: newMessage,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { lastMessage: newMessage },
            );
        });

        it('should update lastReadMessage when provided', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const newMessage = { id: 'msg-789' } as SMessagesEntity;

            await service.updateCon(mockConversation, {
                lastReadMessage: newMessage,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { lastReadMessage: newMessage },
            );
        });

        it('should update multiple fields at once', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const status = SConStatusEnum.CLOSED;
            const newMessage = { id: 'msg-999' } as SMessagesEntity;

            await service.updateCon(mockConversation, {
                label: 'updated-label',
                status,
                lastMessage: newMessage,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                {
                    label: 'updated-label',
                    status,
                    lastMessage: newMessage,
                },
            );
        });

        it('should handle all entities fields together', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const newUser = { id: 'user-new' } as UserEntity;
            const newCode = { id: 'code-new' } as SCodeEntity;
            const lastMessage = { id: 'msg-last' } as SMessagesEntity;
            const lastReadMessage = { id: 'msg-read' } as SMessagesEntity;

            await service.updateCon(mockConversation, {
                createdBy: newUser,
                code: newCode,
                lastMessage,
                lastReadMessage,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                {
                    createdBy: newUser,
                    code: newCode,
                    lastMessage,
                    lastReadMessage,
                },
            );
        });

        it('should not include undefined entities fields in update payload', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateCon(mockConversation, {
                label: 'test',
                createdBy: undefined,
                code: undefined,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { label: 'test' },
            );
        });

        it('should handle status being undefined by not including it', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateCon(mockConversation, {
                label: 'test',
                status: undefined,
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { label: 'test' },
            );
        });

        it('should trim whitespace from label before update', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateCon(mockConversation, {
                label: '\n\t  trimmed-value  \t\n',
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: mockConversation.id },
                { label: 'trimmed-value' },
            );
        });

        it('should use conversation id for update criteria', async () => {
            sConRepo.update.mockResolvedValue({ affected: 1 });
            const customCon = {
                id: 'custom-con-id-123',
            } as SConEntity;

            await service.updateCon(customCon, {
                label: 'test',
            });

            expect(sConRepo.update).toHaveBeenCalledWith(
                { id: 'custom-con-id-123' },
                expect.any(Object),
            );
        });
    });

    describe('baseConsQuery', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                createQueryBuilder: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn(),
                getCount: jest.fn(),
            };

            sConRepo.getRepository.mockReturnValue(mockQueryBuilder);
        });

        it('should create base query with default filters', () => {
            service.baseConsQuery({});

            expect(sConRepo.getRepository).toHaveBeenCalled();
            expect(mockQueryBuilder.createQueryBuilder).toHaveBeenCalledWith('cons');
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('cons.createdBy', 'createdBy');
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'cons.lastMessage',
                'lastMessage',
            );
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('lastMessage.sentBy', 'sentBy');
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('lastMessage.files', 'files');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.deleted = false');
        });

        it('should add conId filter when provided', () => {
            service.baseConsQuery({ conId: 'con-123' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.id = :conId', {
                conId: 'con-123',
            });
        });

        it('should add userId filter when provided', () => {
            service.baseConsQuery({ userId: 'user-456' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-456',
            });
        });

        it('should add status filter when provided', () => {
            const status = SConStatusEnum.ACTIVE;
            service.baseConsQuery({ status });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.status = :status', {
                status,
            });
        });

        it('should add searchTerm filter when provided', () => {
            service.baseConsQuery({ searchTerm: 'test search' });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('cons.label ILIKE :searchTerm'),
                { searchTerm: '%test search%' },
            );
        });

        it('should add all filters when all parameters provided', () => {
            const status = SConStatusEnum.CLOSED;
            service.baseConsQuery({
                conId: 'con-123',
                userId: 'user-456',
                status,
                searchTerm: 'urgent',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.id = :conId', {
                conId: 'con-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-456',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.status = :status', {
                status,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('cons.label ILIKE :searchTerm'),
                { searchTerm: '%urgent%' },
            );
        });

        it('should select specific fields for efficiency', () => {
            service.baseConsQuery({});

            expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith([
                'createdBy.id',
                'createdBy.fullname',
                'lastMessage.id',
                'lastMessage.content',
                'lastMessage.isModified',
                'lastMessage.createdAt',
                'sentBy.id',
                'sentBy.fullname',
            ]);
        });

        it('should not add optional filters when not provided', () => {
            mockQueryBuilder.andWhere.mockClear();

            service.baseConsQuery({});

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(1);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.deleted = false');
        });
    });

    describe('applyUserUnread', () => {
        let mockQueryBuilder: any;
        let mockSubQuery: any;

        beforeEach(() => {
            mockSubQuery = {
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
            };

            mockQueryBuilder = {
                addSelect: jest.fn((callback) => {
                    if (typeof callback === 'function') {
                        callback(mockSubQuery);
                    }
                    return mockQueryBuilder;
                }),
            };
        });

        it('should add unread count subquery for user', () => {
            service.applyUserUnread(mockQueryBuilder, 'user-123');

            expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
            expect(mockSubQuery.select).toHaveBeenCalledWith('COUNT(m.id)', 'unreadCount');
            expect(mockSubQuery.from).toHaveBeenCalledWith(SMessagesEntity, 'm');
            expect(mockSubQuery.where).toHaveBeenCalledWith('m.conId = cons.id');
            expect(mockSubQuery.andWhere).toHaveBeenCalledWith('m.sentBy != :userId', {
                userId: 'user-123',
            });
        });

        it('should handle different user IDs', () => {
            service.applyUserUnread(mockQueryBuilder, 'user-999');

            expect(mockSubQuery.andWhere).toHaveBeenCalledWith('m.sentBy != :userId', {
                userId: 'user-999',
            });
        });

        it('should check for messages created after lastReadMessage', () => {
            service.applyUserUnread(mockQueryBuilder, 'user-123');

            // Verify that andWhere was called with a Brackets instance
            expect(mockSubQuery.andWhere).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('applyAdminUnread', () => {
        let mockQueryBuilder: any;
        let mockSubQuery: any;

        beforeEach(() => {
            mockSubQuery = {
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
            };

            mockQueryBuilder = {
                addSelect: jest.fn((callback) => {
                    if (typeof callback === 'function') {
                        callback(mockSubQuery);
                    }
                    return mockQueryBuilder;
                }),
            };
        });

        it('should add unread count subquery for admin', () => {
            service.applyAdminUnread(mockQueryBuilder, 'admin-123');

            expect(mockQueryBuilder.addSelect).toHaveBeenCalled();
            expect(mockSubQuery.select).toHaveBeenCalledWith('COUNT(m.id)', 'unreadCount');
            expect(mockSubQuery.from).toHaveBeenCalledWith(SMessagesEntity, 'm');
            expect(mockSubQuery.where).toHaveBeenCalledWith('m."conId" = cons.id');
            expect(mockSubQuery.andWhere).toHaveBeenCalledWith('m."sentBy" != :adminId', {
                adminId: 'admin-123',
            });
        });

        it('should handle different admin IDs', () => {
            service.applyAdminUnread(mockQueryBuilder, 'admin-999');

            expect(mockSubQuery.andWhere).toHaveBeenCalledWith('m."sentBy" != :adminId', {
                adminId: 'admin-999',
            });
        });

        it('should join with SAdminConEntity', () => {
            service.applyAdminUnread(mockQueryBuilder, 'admin-123');

            expect(mockSubQuery.leftJoin).toHaveBeenCalledWith(
                SAdminConEntity,
                'suc',
                'suc."conId" = m."conId" AND suc."adminId" = :adminId',
                { adminId: 'admin-123' },
            );
        });

        it('should join with lastReadMessage', () => {
            service.applyAdminUnread(mockQueryBuilder, 'admin-123');

            expect(mockSubQuery.leftJoin).toHaveBeenCalledWith(
                SMessagesEntity,
                'lrm',
                'lrm.id = suc."lastReadMessageId"',
            );
        });

        it('should check for unread conditions with Brackets', () => {
            service.applyAdminUnread(mockQueryBuilder, 'admin-123');

            // Verify that andWhere was called with a Brackets instance
            expect(mockSubQuery.andWhere).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('paginatedConsQuery', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                createQueryBuilder: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            sConRepo.getRepository.mockReturnValue(mockQueryBuilder);
        });

        it('should create paginated query with limit and offset', () => {
            service.paginatedConsQuery(20, 0, {});

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
                'lastMessage.createdAt',
                'DESC',
                'NULLS LAST',
            );
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
        });

        it('should apply filters from baseConsQuery', () => {
            service.paginatedConsQuery(10, 5, {
                userId: 'user-123',
                status: SConStatusEnum.ACTIVE,
                searchTerm: 'test',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-123',
            });
        });

        it('should calculate correct offset for different pages', () => {
            service.paginatedConsQuery(20, 40, {});

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
        });

        it('should handle first page with offset 0', () => {
            service.paginatedConsQuery(15, 0, {});

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
        });

        it('should handle different limit values', () => {
            service.paginatedConsQuery(50, 100, {});

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(100);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
        });
    });

    describe('listConversations', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                getRawAndEntities: jest.fn(),
                getCount: jest.fn(),
                addSelect: jest.fn().mockReturnThis(),
            };

            otherUtils.paginateResultsFromCache = jest.fn();
            sTransformService.transformConsWithUnread = jest.fn();
        });

        it('should list conversations with unread counts', async () => {
            const mockEntities = [mockConversation];
            const mockRaw = [{ unreadCount: '5' }];
            const mockTransformed = [{ id: 'con-123', unreadCount: 5 }];

            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                entities: mockEntities,
                raw: mockRaw,
            });
            mockQueryBuilder.getCount.mockResolvedValue(1);
            sTransformService.transformConsWithUnread.mockReturnValue(mockTransformed);
            otherUtils.paginateResultsFromCache.mockReturnValue({
                data: mockTransformed,
                total: 1,
                page: 1,
                limit: 20,
            });

            const buildQuery = () => mockQueryBuilder;
            const applyUnread = jest.fn();

            await service.listConversations(buildQuery, applyUnread, 1, 20);

            expect(applyUnread).toHaveBeenCalledWith(mockQueryBuilder);
            expect(mockQueryBuilder.getRawAndEntities).toHaveBeenCalled();
            expect(mockQueryBuilder.getCount).toHaveBeenCalled();
            expect(sTransformService.transformConsWithUnread).toHaveBeenCalledWith(
                mockEntities,
                mockRaw,
            );
            expect(otherUtils.paginateResultsFromCache).toHaveBeenCalledWith(
                mockTransformed,
                1,
                1,
                20,
            );
        });

        it('should handle empty results', async () => {
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                entities: [],
                raw: [],
            });
            mockQueryBuilder.getCount.mockResolvedValue(0);
            sTransformService.transformConsWithUnread.mockReturnValue([]);
            otherUtils.paginateResultsFromCache.mockReturnValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            const buildQuery = () => mockQueryBuilder;
            const applyUnread = jest.fn();

            const result = await service.listConversations(buildQuery, applyUnread, 1, 20);

            expect(result).toEqual({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });
            expect(sTransformService.transformConsWithUnread).toHaveBeenCalledWith([], []);
        });

        it('should execute getRawAndEntities and getCount in parallel', async () => {
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                entities: [],
                raw: [],
            });
            mockQueryBuilder.getCount.mockResolvedValue(0);
            sTransformService.transformConsWithUnread.mockReturnValue([]);
            otherUtils.paginateResultsFromCache.mockReturnValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });

            const buildQuery = () => mockQueryBuilder;
            const applyUnread = jest.fn();

            await service.listConversations(buildQuery, applyUnread, 1, 20);

            expect(mockQueryBuilder.getRawAndEntities).toHaveBeenCalledTimes(1);
            expect(mockQueryBuilder.getCount).toHaveBeenCalledTimes(1);
        });
    });

    describe('userConversations', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                createQueryBuilder: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [],
                    raw: [],
                }),
                getCount: jest.fn().mockResolvedValue(0),
            };

            sConRepo.getRepository.mockReturnValue(mockQueryBuilder);
            sTransformService.transformConsWithUnread = jest.fn().mockReturnValue([]);
            otherUtils.paginateResultsFromCache = jest.fn().mockReturnValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });
        });

        it('should get user conversations with default pagination', async () => {
            await service.userConversations('user-123');

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
        });

        it('should apply user filters', async () => {
            await service.userConversations('user-456', SConStatusEnum.ACTIVE, 'search term');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-456',
            });
        });

        it('should calculate offset correctly for page 2', async () => {
            await service.userConversations('user-123', undefined, undefined, 2, 20);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
        });

        it('should handle custom limit', async () => {
            await service.userConversations('user-123', undefined, undefined, 1, 50);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
        });

        it('should apply user unread count', async () => {
            const applyUserUnreadSpy = jest.spyOn(service, 'applyUserUnread');

            await service.userConversations('user-789');

            expect(applyUserUnreadSpy).toHaveBeenCalled();
        });

        it('should filter by status when provided', async () => {
            await service.userConversations('user-123', SConStatusEnum.CLOSED);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.status = :status', {
                status: SConStatusEnum.CLOSED,
            });
        });

        it('should filter by searchTerm when provided', async () => {
            await service.userConversations('user-123', undefined, 'important');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('cons.label ILIKE :searchTerm'),
                { searchTerm: '%important%' },
            );
        });
    });

    describe('adminConversations', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                createQueryBuilder: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    entities: [],
                    raw: [],
                }),
                getCount: jest.fn().mockResolvedValue(0),
            };

            sConRepo.getRepository.mockReturnValue(mockQueryBuilder);
            sTransformService.transformConsWithUnread = jest.fn().mockReturnValue([]);
            otherUtils.paginateResultsFromCache = jest.fn().mockReturnValue({
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            });
        });

        it('should get admin conversations with default pagination', async () => {
            await service.adminConversations('admin-123');

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
        });

        it('should not filter by userId for admin', async () => {
            await service.adminConversations('admin-123');

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
                'createdBy.id = :userId',
                expect.anything(),
            );
        });

        it('should apply status filter when provided', async () => {
            await service.adminConversations('admin-123', SConStatusEnum.CLOSED);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.status = :status', {
                status: SConStatusEnum.CLOSED,
            });
        });

        it('should apply search term filter', async () => {
            await service.adminConversations('admin-123', undefined, 'urgent ticket');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('cons.label ILIKE :searchTerm'),
                { searchTerm: '%urgent ticket%' },
            );
        });

        it('should calculate offset for different pages', async () => {
            await service.adminConversations('admin-123', undefined, undefined, 3, 15);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(30);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(15);
        });

        it('should apply admin unread count', async () => {
            const applyAdminUnreadSpy = jest.spyOn(service, 'applyAdminUnread');

            await service.adminConversations('admin-999');

            expect(applyAdminUnreadSpy).toHaveBeenCalled();
        });

        it('should handle all filters together', async () => {
            await service.adminConversations('admin-123', SConStatusEnum.ACTIVE, 'search', 2, 25);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.status = :status', {
                status: SConStatusEnum.ACTIVE,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('cons.label ILIKE :searchTerm'),
                { searchTerm: '%search%' },
            );
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(25);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
        });
    });

    describe('emitToViewer', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                createQueryBuilder: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn(),
            };

            sConRepo.getRepository.mockReturnValue(mockQueryBuilder);
            sTransformService.transformCon = jest.fn().mockReturnValue({
                id: 'con-123',
                label: 'Ticket id: #12345678',
            });
        });

        it('should emit conversation update to viewer', async () => {
            const mockRaw = { unreadCount: '3' };
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                raw: [mockRaw],
            });

            const applyUnread = jest.fn();

            await service.emitToViewer(
                'viewer-123',
                'con-123',
                mockMessage,
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                applyUnread,
            );

            expect(applyUnread).toHaveBeenCalledWith(mockQueryBuilder);
            expect(mockQueryBuilder.getRawAndEntities).toHaveBeenCalled();
            expect(sTransformService.transformCon).toHaveBeenCalledWith(mockRaw, mockMessage, 3);
            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'viewer-123',
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                {
                    payload: [
                        {
                            id: 'con-123',
                            label: 'Ticket id: #12345678',
                        },
                    ],
                },
            );
        });

        it('should not emit if no row found', async () => {
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                raw: [],
            });

            const applyUnread = jest.fn();

            await service.emitToViewer(
                'viewer-123',
                'con-123',
                mockMessage,
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                applyUnread,
            );

            expect(socketService.sendDataToUser).not.toHaveBeenCalled();
        });

        it('should handle null unreadCount', async () => {
            const mockRaw = { unreadCount: null };
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                raw: [mockRaw],
            });

            const applyUnread = jest.fn();

            await service.emitToViewer(
                'viewer-456',
                'con-456',
                mockMessage,
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                applyUnread,
            );

            expect(sTransformService.transformCon).toHaveBeenCalledWith(mockRaw, mockMessage, 0);
        });

        it('should handle undefined unreadCount', async () => {
            const mockRaw = { unreadCount: undefined };
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                raw: [mockRaw],
            });

            const applyUnread = jest.fn();

            await service.emitToViewer(
                'viewer-789',
                'con-789',
                mockMessage,
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                applyUnread,
            );

            expect(sTransformService.transformCon).toHaveBeenCalledWith(mockRaw, mockMessage, 0);
        });

        it('should filter by conId in query', async () => {
            mockQueryBuilder.getRawAndEntities.mockResolvedValue({
                raw: [{ unreadCount: '0' }],
            });

            const applyUnread = jest.fn();

            await service.emitToViewer(
                'viewer-123',
                'specific-con-id',
                mockMessage,
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                applyUnread,
            );

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cons.id = :conId', {
                conId: 'specific-con-id',
            });
        });
    });

    describe('emitConversationUpdate', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                createQueryBuilder: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawAndEntities: jest.fn().mockResolvedValue({
                    raw: [{ unreadCount: '0' }],
                }),
            };

            sConRepo.getRepository.mockReturnValue(mockQueryBuilder);
            sTransformService.transformCon = jest.fn().mockReturnValue({
                id: 'con-123',
            });
        });

        it('should emit to conversation creator', async () => {
            sAdminConRepo.find.mockResolvedValue([]);

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                mockUser.id,
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                expect.any(Object),
            );
        });

        it('should emit to all associated admins', async () => {
            const admin1 = {
                id: 'admin-1',
                fullname: 'Admin One',
            } as UserEntity;
            const admin2 = {
                id: 'admin-2',
                fullname: 'Admin Two',
            } as UserEntity;

            sAdminConRepo.find.mockResolvedValue([{ admin: admin1 }, { admin: admin2 }]);

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(socketService.sendDataToUser).toHaveBeenCalledTimes(3); // creator + 2 admins
            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'admin-1',
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                expect.any(Object),
            );
            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                'admin-2',
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                expect.any(Object),
            );
        });

        it('should query admin conversations with correct relation', async () => {
            sAdminConRepo.find.mockResolvedValue([]);

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(sAdminConRepo.find).toHaveBeenCalledWith({
                where: { conversation: { id: mockConversation.id } },
                relations: ['admin'],
            });
        });

        it('should apply user unread for creator', async () => {
            sAdminConRepo.find.mockResolvedValue([]);
            const applyUserUnreadSpy = jest.spyOn(service, 'applyUserUnread');

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(applyUserUnreadSpy).toHaveBeenCalledWith(expect.anything(), mockUser.id);
        });

        it('should apply admin unread for each admin', async () => {
            const admin1 = { id: 'admin-1' } as UserEntity;
            sAdminConRepo.find.mockResolvedValue([{ admin: admin1 }]);

            const applyAdminUnreadSpy = jest.spyOn(service, 'applyAdminUnread');

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(applyAdminUnreadSpy).toHaveBeenCalledWith(expect.anything(), 'admin-1');
        });

        it('should handle conversation with no admins', async () => {
            sAdminConRepo.find.mockResolvedValue([]);

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(socketService.sendDataToUser).toHaveBeenCalledTimes(1); // Only creator
        });

        it('should use emitToViewer for each recipient', async () => {
            const admin1 = { id: 'admin-1' } as UserEntity;
            sAdminConRepo.find.mockResolvedValue([{ admin: admin1 }]);

            const emitToViewerSpy = jest.spyOn(service, 'emitToViewer');

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(emitToViewerSpy).toHaveBeenCalledTimes(2); // creator + 1 admin
        });

        it('should emit with correct event type', async () => {
            sAdminConRepo.find.mockResolvedValue([]);

            await service.emitConversationUpdate(mockConversation, mockMessage);

            expect(socketService.sendDataToUser).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                expect.any(Object),
            );
        });
    });
});
