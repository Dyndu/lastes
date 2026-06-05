import { Test, TestingModule } from '@nestjs/testing';
import { SMessagesService } from './s-messages.service';
import { SupportsService } from './supports.service';
import { SConEntity, SMessagesEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { ExistenceCheckModeEnum, FileUsageEnum, SocketEventEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SMessagesService', () => {
    let service: SMessagesService;
    let sMessageRepo: any;
    let sAdminConRepo: any;
    let sTransformService: any;
    let otherUtils: any;
    let errorHandler: any;
    let logger: any;
    let socketService: any;
    let fileLinkService: any;
    let sConsService: any;

    const mockUser: UserEntity = {
        id: 'user-123',
        email: 'user@test.com',
        firstname: 'Test',
        lastname: 'User',
    } as any;

    const mockAdmin: UserEntity = {
        id: 'admin-123',
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'User',
    } as any;

    const mockConversation: SConEntity = {
        id: 'con-123',
        label: '12345678',
        createdBy: mockUser,
        deleted: false,
    } as SConEntity;

    const mockMessage: SMessagesEntity = {
        id: 'msg-123',
        content: 'Test message',
        sentBy: mockUser,
        con: mockConversation,
        createdAt: new Date('2024-01-01'),
    } as SMessagesEntity;

    const mockFileLink: FileLinksEntity = {
        id: 'file-link-123',
        file: { id: 'file-123' },
    } as any;

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        sConsService = {
            updateCon: jest.fn(),
        };

        errorHandler = {
            badRequest: jest.fn(),
            notFound: jest.fn(),
        };

        otherUtils = {
            formatCriteria: jest.fn(),
            assertState: jest.fn(),
        };

        sMessageRepo = {
            findOne: jest.fn(),
            findActiveOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            getRepository: jest.fn(),
        };

        sAdminConRepo = {
            findOne: jest.fn(),
        };

        sTransformService = {
            messageSentEntities: jest.fn(),
            transformMessage: jest.fn(),
        };

        socketService = {
            sendDataToRoom: jest.fn(),
        };

        fileLinkService = {
            linkFilesToEntity: jest.fn(),
        };

        const mockSupportsService = {
            sMessageRepo,
            sAdminConRepo,
            sTransformService,
            otherUtils,
            errorHandler,
            logger,
            socketService,
            fileLinkService,
            sConsService,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SMessagesService,
                {
                    provide: SupportsService,
                    useValue: mockSupportsService,
                },
            ],
        }).compile();

        service = module.get<SMessagesService>(SMessagesService);
        module.get(SupportsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildSMessage', () => {
        it('should build SMessagesEntity with required fields only', () => {
            const result = service.buildSMessage(
                {
                    sentBy: mockUser,
                    con: mockConversation,
                },
                {},
            );

            expect(result).toBeInstanceOf(SMessagesEntity);
            expect(result.sentBy).toEqual(mockUser);
            expect(result.con).toEqual(mockConversation);
            expect(result.content).toBeUndefined();
            expect(result.replyToMessage).toBeUndefined();
            expect(result.files).toBeUndefined();
        });

        it('should build SMessagesEntity with all fields', () => {
            const replyMessage = {
                ...mockMessage,
                id: 'msg-456',
            } as SMessagesEntity;
            const files = [mockFileLink];

            const result = service.buildSMessage(
                {
                    sentBy: mockUser,
                    con: mockConversation,
                },
                {
                    content: 'Test content',
                    replyToMessage: replyMessage,
                    files,
                },
            );

            expect(result).toBeInstanceOf(SMessagesEntity);
            expect(result.sentBy).toEqual(mockUser);
            expect(result.con).toEqual(mockConversation);
            expect(result.content).toBe('Test content');
            expect(result.replyToMessage).toEqual(replyMessage);
            expect(result.files).toEqual(files);
        });

        it('should build SMessagesEntity with only content', () => {
            const result = service.buildSMessage(
                {
                    sentBy: mockUser,
                    con: mockConversation,
                },
                {
                    content: 'Only content',
                },
            );

            expect(result.content).toBe('Only content');
            expect(result.replyToMessage).toBeUndefined();
            expect(result.files).toBeUndefined();
        });

        it('should build SMessagesEntity with only replyToMessage', () => {
            const replyMessage = mockMessage;

            const result = service.buildSMessage(
                {
                    sentBy: mockUser,
                    con: mockConversation,
                },
                {
                    replyToMessage: replyMessage,
                },
            );

            expect(result.content).toBeUndefined();
            expect(result.replyToMessage).toEqual(replyMessage);
            expect(result.files).toBeUndefined();
        });

        it('should build SMessagesEntity with only files', () => {
            const files = [mockFileLink];

            const result = service.buildSMessage(
                {
                    sentBy: mockUser,
                    con: mockConversation,
                },
                {
                    files,
                },
            );

            expect(result.content).toBeUndefined();
            expect(result.replyToMessage).toBeUndefined();
            expect(result.files).toEqual(files);
        });

        it('should use Object.assign to merge fields', () => {
            const result = service.buildSMessage(
                {
                    sentBy: mockUser,
                    con: mockConversation,
                },
                {
                    content: 'Merged content',
                },
            );

            expect(result.sentBy).toBe(mockUser);
            expect(result.con).toBe(mockConversation);
            expect(result.content).toBe('Merged content');
        });

        it('should create a new instance each time', () => {
            const result1 = service.buildSMessage({ sentBy: mockUser, con: mockConversation }, {});

            const result2 = service.buildSMessage({ sentBy: mockUser, con: mockConversation }, {});

            expect(result1).not.toBe(result2);
            expect(result1).toBeInstanceOf(SMessagesEntity);
            expect(result2).toBeInstanceOf(SMessagesEntity);
        });
    });

    describe('checkUserIsConOwner', () => {
        it('should not throw error when user is conversation owner', () => {
            const con = { ...mockConversation, createdBy: mockUser } as any;

            service.checkUserIsConOwner(mockUser, con);

            expect(otherUtils.assertState).toHaveBeenCalledWith(
                mockUser.id,
                mockUser.id,
                ExistenceCheckModeEnum.MUST_EXIST,
                {
                    label: 'Conversation Owner',
                    entityName: 'Support conversation',
                },
            );
        });

        it('should call assertState with correct parameters', () => {
            const con = { ...mockConversation, createdBy: mockAdmin } as any;

            service.checkUserIsConOwner(mockUser, con);

            expect(otherUtils.assertState).toHaveBeenCalledWith(
                mockUser.id,
                mockAdmin.id,
                ExistenceCheckModeEnum.MUST_EXIST,
                {
                    label: 'Conversation Owner',
                    entityName: 'Support conversation',
                },
            );
        });

        it('should throw error when user is not conversation owner', () => {
            const con = { ...mockConversation, createdBy: mockAdmin } as any;

            otherUtils.assertState.mockImplementation(() => {
                throw new Error('Not owner');
            });

            expect(() => service.checkUserIsConOwner(mockUser, con)).toThrow('Not owner');
        });

        it('should use MUST_EXIST check mode', () => {
            service.checkUserIsConOwner(mockUser, mockConversation);

            expect(otherUtils.assertState).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                ExistenceCheckModeEnum.MUST_EXIST,
                expect.any(Object),
            );
        });
    });

    describe('retrieveSMessageByCriteria', () => {
        it('should retrieve a message by criteria without relations', async () => {
            const criteria = { id: 'msg-123' };

            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);

            const result = await service.retrieveSMessageByCriteria(criteria);

            expect(logger.info).toHaveBeenCalledWith('Find a support message by id: msg-123');
            expect(sMessageRepo.findActiveOne).toHaveBeenCalledWith(
                sMessageRepo,
                criteria,
                undefined,
            );
            expect(result).toEqual(mockMessage);
        });

        it('should retrieve a message by criteria with relations', async () => {
            const criteria = { id: 'msg-123' };
            const relations = ['sentBy', 'con', 'replyToMessage'];

            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);

            const result = await service.retrieveSMessageByCriteria(criteria, relations);

            expect(sMessageRepo.findActiveOne).toHaveBeenCalledWith(
                sMessageRepo,
                criteria,
                relations,
            );
            expect(result).toEqual(mockMessage);
        });

        it('should throw not found error when message does not exist', async () => {
            const criteria = { id: 'non-existent' };

            otherUtils.formatCriteria.mockReturnValue('id: non-existent');
            sMessageRepo.findActiveOne.mockResolvedValue(null);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.retrieveSMessageByCriteria(criteria)).rejects.toThrow('Not found');

            expect(errorHandler.notFound).toHaveBeenCalledWith(
                'Support message not found with id: non-existent',
                'Support message not found',
            );
        });

        it('should handle multiple criteria', async () => {
            const criteria = { id: 'msg-123', content: 'Test' };

            otherUtils.formatCriteria.mockReturnValue('id: msg-123, content: Test');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);

            await service.retrieveSMessageByCriteria(criteria);

            expect(logger.info).toHaveBeenCalledWith(
                'Find a support message by id: msg-123, content: Test',
            );
        });

        it('should handle when findActiveOne returns undefined', async () => {
            const criteria = { id: 'msg-123' };

            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(undefined);
            errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.retrieveSMessageByCriteria(criteria)).rejects.toThrow('Not found');
        });
    });

    describe('updateMessage', () => {
        it('should return message when no updates provided', async () => {
            const result = await service.updateMessage(mockMessage);

            expect(result).toEqual({
                message: 'No updates provided for support message',
            });
            expect(sMessageRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when empty updates object', async () => {
            const result = await service.updateMessage(mockMessage, {});

            expect(result).toEqual({
                message: 'No updates provided for support message',
            });
            expect(sMessageRepo.update).not.toHaveBeenCalled();
        });

        it('should update message with content', async () => {
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, {
                content: 'Updated content',
            });

            expect(sMessageRepo.update).toHaveBeenCalledWith(
                { id: mockMessage.id },
                { content: 'Updated content' },
            );
        });

        it('should trim content before updating', async () => {
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, {
                content: '  Trimmed  ',
            });

            expect(sMessageRepo.update).toHaveBeenCalledWith(
                { id: mockMessage.id },
                { content: 'Trimmed' },
            );
        });

        it('should not update with empty string content', async () => {
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, { content: '   ' });

            expect(sMessageRepo.update).toHaveBeenCalledWith({ id: mockMessage.id }, {});
        });

        it('should update message with replyToMessage', async () => {
            const replyMessage = {
                ...mockMessage,
                id: 'msg-456',
            } as SMessagesEntity;
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, {
                replyToMessage: replyMessage,
            });

            expect(sMessageRepo.update).toHaveBeenCalledWith(
                { id: mockMessage.id },
                { replyToMessage: replyMessage },
            );
        });

        it('should update message with files', async () => {
            const files = [mockFileLink];
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, { files });

            expect(sMessageRepo.update).toHaveBeenCalledWith({ id: mockMessage.id }, { files });
        });

        it('should update with multiple fields', async () => {
            const replyMessage = mockMessage;
            const files = [mockFileLink];
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, {
                content: 'New content',
                replyToMessage: replyMessage,
                files,
            });

            expect(sMessageRepo.update).toHaveBeenCalledWith(
                { id: mockMessage.id },
                {
                    content: 'New content',
                    replyToMessage: replyMessage,
                    files,
                },
            );
        });

        it('should handle undefined entities fields', async () => {
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, {
                replyToMessage: undefined,
                files: undefined,
            });

            expect(sMessageRepo.update).toHaveBeenCalledWith(
                { id: mockMessage.id },
                {
                    replyToMessage: undefined,
                    files: undefined,
                },
            );
        });

        it('should only process defined string fields', async () => {
            sMessageRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateMessage(mockMessage, {
                content: undefined,
            });

            expect(sMessageRepo.update).toHaveBeenCalledWith({ id: mockMessage.id }, {});
        });
    });

    describe('wsMessage', () => {
        it('should send websocket message to conversation room', () => {
            const data = { id: 'msg-123', content: 'Test' };

            service.wsMessage(mockConversation, SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT, data);

            expect(socketService.sendDataToRoom).toHaveBeenCalledWith(
                '/supports',
                'support-con-123-room',
                SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT,
                {
                    payload: [data],
                },
            );
        });

        it('should use correct room format with conversation id', () => {
            const con = { ...mockConversation, id: 'con-456' } as SConEntity;
            const data = { test: 'data' };

            service.wsMessage(con, SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT, data);

            expect(socketService.sendDataToRoom).toHaveBeenCalledWith(
                '/supports',
                'support-con-456-room',
                expect.any(String),
                expect.any(Object),
            );
        });

        it('should wrap data in payload array', () => {
            const data = { message: 'test' };

            service.wsMessage(mockConversation, SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT, data);

            expect(socketService.sendDataToRoom).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.any(String),
                {
                    payload: [data],
                },
            );
        });

        it('should use /supports route', () => {
            service.wsMessage(mockConversation, SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT, {});

            expect(socketService.sendDataToRoom).toHaveBeenCalledWith(
                '/supports',
                expect.any(String),
                expect.any(String),
                expect.any(Object),
            );
        });
    });

    describe('getReplyMessage', () => {
        it('should return undefined when no replyMessageId provided', async () => {
            const result = await service.getReplyMessage();

            expect(result).toBeUndefined();
            expect(sMessageRepo.findActiveOne).not.toHaveBeenCalled();
        });

        it('should return undefined when replyMessageId is undefined', async () => {
            const result = await service.getReplyMessage(undefined);

            expect(result).toBeUndefined();
            expect(sMessageRepo.findActiveOne).not.toHaveBeenCalled();
        });

        it('should retrieve reply message when replyMessageId provided', async () => {
            otherUtils.formatCriteria.mockReturnValue('id: msg-456');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);

            const result = await service.getReplyMessage('msg-456');

            expect(sMessageRepo.findActiveOne).toHaveBeenCalled();
            expect(result).toEqual(mockMessage);
        });

        it('should call retrieveSMessageByCriteria with correct id', async () => {
            const retrieveSpy = jest.spyOn(service, 'retrieveSMessageByCriteria');
            otherUtils.formatCriteria.mockReturnValue('id: msg-789');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);

            await service.getReplyMessage('msg-789');

            expect(retrieveSpy).toHaveBeenCalledWith({ id: 'msg-789' });
        });
    });

    describe('createMessage', () => {
        let sConsService: any;

        beforeEach(() => {
            sConsService = {
                updateCon: jest.fn(),
            };

            const mockSupportsService = service['supportsService'];
            (mockSupportsService as any).sConsService = sConsService;
        });

        it('should create message with required fields only', async () => {
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });

            const result = await service.createMessage(mockConversation, mockUser);

            expect(sMessageRepo.create).toHaveBeenCalled();
            const createdEntity = sMessageRepo.create.mock.calls[0][0];
            expect(createdEntity).toBeInstanceOf(SMessagesEntity);
            expect(createdEntity.con).toEqual(mockConversation);
            expect(createdEntity.sentBy).toEqual(mockUser);
            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                lastMessage: mockMessage,
            });
            expect(result).toEqual(mockMessage);
        });

        it('should create message with content', async () => {
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });

            await service.createMessage(mockConversation, mockUser, 'Test content');

            const createdEntity = sMessageRepo.create.mock.calls[0][0];
            expect(createdEntity.content).toBe('Test content');
            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                lastMessage: mockMessage,
            });
        });

        it('should create message with replyToMessage', async () => {
            const replyMessage = mockMessage;
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });

            await service.createMessage(mockConversation, mockUser, undefined, replyMessage);

            const createdEntity = sMessageRepo.create.mock.calls[0][0];
            expect(createdEntity.replyToMessage).toEqual(replyMessage);
            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                lastMessage: mockMessage,
            });
        });

        it('should create message with content and replyToMessage', async () => {
            const replyMessage = mockMessage;
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });

            await service.createMessage(mockConversation, mockUser, 'Reply content', replyMessage);

            const createdEntity = sMessageRepo.create.mock.calls[0][0];
            expect(createdEntity.content).toBe('Reply content');
            expect(createdEntity.replyToMessage).toEqual(replyMessage);
            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                lastMessage: mockMessage,
            });
        });

        it('should call buildSMessage with correct parameters', async () => {
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });
            const buildSpy = jest.spyOn(service, 'buildSMessage');

            await service.createMessage(mockConversation, mockUser, 'Content', mockMessage);

            expect(buildSpy).toHaveBeenCalledWith(
                { con: mockConversation, sentBy: mockUser },
                { content: 'Content', replyToMessage: mockMessage },
            );
            expect(sConsService.updateCon).toHaveBeenCalled();
        });

        it('should update conversation lastMessage after creating message', async () => {
            const newMessage = { ...mockMessage, id: 'new-msg-123' };
            sMessageRepo.create.mockResolvedValue(newMessage);
            sConsService.updateCon.mockResolvedValue({ affected: 1 });

            await service.createMessage(mockConversation, mockUser);

            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                lastMessage: newMessage,
            });
        });
    });

    describe('attachFilesToMessage', () => {
        it('should attach files to message', async () => {
            const fileIds = ['file-1', 'file-2'];
            const fileLinks = [mockFileLink, { ...mockFileLink, id: 'file-link-456' }];

            fileLinkService.linkFilesToEntity.mockResolvedValue(fileLinks);

            await service.attachFilesToMessage(mockMessage, fileIds);

            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalledWith(
                fileIds,
                FileUsageEnum.SUPPORT_MESSAGE,
                { message: mockMessage },
            );
        });

        it('should use SUPPORT_MESSAGE file usage', async () => {
            const fileIds = ['file-1'];
            fileLinkService.linkFilesToEntity.mockResolvedValue([mockFileLink]);

            await service.attachFilesToMessage(mockMessage, fileIds);

            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalledWith(
                expect.any(Array),
                FileUsageEnum.SUPPORT_MESSAGE,
                expect.any(Object),
            );
        });

        it('should handle single file', async () => {
            const fileIds = ['file-1'];
            fileLinkService.linkFilesToEntity.mockResolvedValue([mockFileLink]);

            await service.attachFilesToMessage(mockMessage, fileIds);

            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalledWith(
                ['file-1'],
                expect.any(String),
                expect.any(Object),
            );
        });

        it('should handle multiple files', async () => {
            const fileIds = ['file-1', 'file-2', 'file-3'];
            const fileLinks = [mockFileLink, mockFileLink, mockFileLink];
            fileLinkService.linkFilesToEntity.mockResolvedValue(fileLinks);

            await service.attachFilesToMessage(mockMessage, fileIds);

            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalledWith(
                fileIds,
                expect.any(String),
                expect.any(Object),
            );
        });
    });

    describe('retrieveAndNotify', () => {
        it('should retrieve message and send websocket notification', async () => {
            const transformedMessage = {
                id: 'msg-123',
                content: 'Transformed',
            };

            sTransformService.messageSentEntities.mockReturnValue(['sentBy', 'con']);
            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue(transformedMessage);

            const result = await service.retrieveAndNotify(mockConversation, 'msg-123');

            expect(sMessageRepo.findActiveOne).toHaveBeenCalledWith(
                sMessageRepo,
                { id: 'msg-123' },
                ['sentBy', 'con'],
            );
            expect(sTransformService.transformMessage).toHaveBeenCalledWith(mockMessage);
            expect(socketService.sendDataToRoom).toHaveBeenCalledWith(
                '/supports',
                'support-con-123-room',
                SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT,
                {
                    payload: [transformedMessage],
                },
            );
            expect(result).toEqual(mockMessage);
        });

        it('should use messageSentEntities relations', async () => {
            const customRelations = ['sentBy', 'con', 'replyToMessage', 'files'];

            sTransformService.messageSentEntities.mockReturnValue(customRelations);
            otherUtils.formatCriteria.mockReturnValue('id: msg-456');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            await service.retrieveAndNotify(mockConversation, 'msg-456');

            expect(sMessageRepo.findActiveOne).toHaveBeenCalledWith(
                sMessageRepo,
                { id: 'msg-456' },
                customRelations,
            );
        });

        it('should call wsMessage with transformed data', async () => {
            const transformedData = { id: 'msg-789', transformed: true };

            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-789');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue(transformedData);

            const wsSpy = jest.spyOn(service, 'wsMessage');

            await service.retrieveAndNotify(mockConversation, 'msg-789');

            expect(wsSpy).toHaveBeenCalledWith(
                mockConversation,
                SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT,
                transformedData,
            );
        });
    });

    describe('sendMessage', () => {
        let sConsService: any;

        beforeEach(() => {
            sConsService = {
                updateCon: jest.fn().mockResolvedValue({ affected: 1 }),
            };

            const mockSupportsService = service['supportsService'];
            (mockSupportsService as any).sConsService = sConsService;
        });

        it('should send message without reply and files', async () => {
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            const result = await service.sendMessage(
                mockConversation,
                mockUser,
                undefined,
                'Test content',
            );

            expect(sMessageRepo.create).toHaveBeenCalled();
            expect(fileLinkService.linkFilesToEntity).not.toHaveBeenCalled();
            expect(result).toEqual(mockMessage); // <- Changé ici
        });

        it('should send message with reply', async () => {
            const replyMessage = mockMessage;

            otherUtils.formatCriteria.mockReturnValue('id: msg-456');
            sMessageRepo.findActiveOne
                .mockResolvedValueOnce(replyMessage)
                .mockResolvedValueOnce(mockMessage);
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            sTransformService.transformMessage.mockReturnValue({});

            const result = await service.sendMessage(
                mockConversation,
                mockUser,
                'msg-456',
                'Reply content',
            );

            const createdEntity = sMessageRepo.create.mock.calls[0][0];
            expect(createdEntity.replyToMessage).toEqual(replyMessage);
            expect(result).toEqual(mockMessage);
        });

        it('should send message with files', async () => {
            const fileIds = ['file-1', 'file-2'];

            sMessageRepo.create.mockResolvedValue(mockMessage);
            fileLinkService.linkFilesToEntity.mockResolvedValue([mockFileLink]);
            sMessageRepo.update.mockResolvedValue({ affected: 1 });
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            const result = await service.sendMessage(
                mockConversation,
                mockUser,
                undefined,
                'Content',
                fileIds,
            );

            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalledWith(
                fileIds,
                FileUsageEnum.SUPPORT_MESSAGE,
                { message: mockMessage },
            );
            expect(result).toEqual(mockMessage);
        });

        it('should send message with reply and files', async () => {
            const replyMessage = mockMessage;
            const fileIds = ['file-1'];

            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne
                .mockResolvedValueOnce(replyMessage)
                .mockResolvedValueOnce(mockMessage);
            sMessageRepo.create.mockResolvedValue(mockMessage);
            fileLinkService.linkFilesToEntity.mockResolvedValue([mockFileLink]);
            sMessageRepo.update.mockResolvedValue({ affected: 1 });
            sTransformService.messageSentEntities.mockReturnValue([]);
            sTransformService.transformMessage.mockReturnValue({});

            const result = await service.sendMessage(
                mockConversation,
                mockUser,
                'msg-456',
                'Full message',
                fileIds,
            );

            expect(sMessageRepo.create).toHaveBeenCalled();
            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalled();
            expect(result).toEqual(mockMessage);
        });

        it('should call getReplyMessage when replyMessageId provided', async () => {
            const getReplySpy = jest.spyOn(service, 'getReplyMessage');

            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne
                .mockResolvedValueOnce(mockMessage)
                .mockResolvedValueOnce(mockMessage);
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            sTransformService.transformMessage.mockReturnValue({});

            await service.sendMessage(mockConversation, mockUser, 'msg-789', 'Content');

            expect(getReplySpy).toHaveBeenCalledWith('msg-789');
        });

        it('should call createMessage with correct parameters', async () => {
            const createSpy = jest.spyOn(service, 'createMessage');

            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            await service.sendMessage(mockConversation, mockUser, undefined, 'Test');

            expect(createSpy).toHaveBeenCalledWith(mockConversation, mockUser, 'Test', undefined);
        });

        it('should call attachFilesToMessage only when fileIds provided', async () => {
            const attachSpy = jest.spyOn(service, 'attachFilesToMessage');

            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-124');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            await service.sendMessage(mockConversation, mockUser, undefined, 'Test');

            expect(attachSpy).not.toHaveBeenCalled();
        });

        it('should call retrieveAndNotify with message id', async () => {
            const retrieveSpy = jest.spyOn(service, 'retrieveAndNotify');

            sMessageRepo.create.mockResolvedValue({
                ...mockMessage,
                id: 'new-msg-id',
            });
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: new-msg-id');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            await service.sendMessage(mockConversation, mockUser, undefined, 'Test');

            expect(retrieveSpy).toHaveBeenCalledWith(mockConversation, 'new-msg-id');
        });

        it('should return the message from retrieveAndNotify', async () => {
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            const result = await service.sendMessage(
                mockConversation,
                mockUser,
                undefined,
                'Content',
            );

            expect(result).toEqual(mockMessage);
        });

        it('should handle sendMessage with all optional parameters', async () => {
            const replyMessage = { ...mockMessage, id: 'reply-msg' };
            const fileIds = ['file-1', 'file-2'];

            otherUtils.formatCriteria.mockReturnValue('id: msg-complete');
            sMessageRepo.findActiveOne
                .mockResolvedValueOnce(replyMessage)
                .mockResolvedValueOnce(mockMessage);
            sMessageRepo.create.mockResolvedValue(mockMessage);
            fileLinkService.linkFilesToEntity.mockResolvedValue([mockFileLink]);
            sMessageRepo.update.mockResolvedValue({ affected: 1 });
            sTransformService.messageSentEntities.mockReturnValue([]);
            sTransformService.transformMessage.mockReturnValue({});

            const result = await service.sendMessage(
                mockConversation,
                mockUser,
                'reply-msg',
                'Complete message',
                fileIds,
            );

            expect(result).toBeDefined();
            expect(sMessageRepo.create).toHaveBeenCalled();
            expect(fileLinkService.linkFilesToEntity).toHaveBeenCalled();
        });

        it('should call updateCon through createMessage', async () => {
            sMessageRepo.create.mockResolvedValue(mockMessage);
            sTransformService.messageSentEntities.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id: msg-123');
            sMessageRepo.findActiveOne.mockResolvedValue(mockMessage);
            sTransformService.transformMessage.mockReturnValue({});

            await service.sendMessage(mockConversation, mockUser, undefined, 'Test');

            expect(sConsService.updateCon).toHaveBeenCalledWith(mockConversation, {
                lastMessage: mockMessage,
            });
        });
    });

    describe('buildMessageQuery', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should create query builder with message alias', () => {
            const repo = sMessageRepo.getRepository();
            service.buildMessageQuery();

            expect(repo.createQueryBuilder).toHaveBeenCalledWith('m');
        });

        it('should join sentBy relation', () => {
            service.buildMessageQuery();

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('m.sentBy', 'sentBy');
        });

        it('should join avatar and avatar file', () => {
            service.buildMessageQuery();

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'sentBy.avatar',
                'avatar',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'avatar.file',
                'avatarFile',
            );
        });

        it('should join files relation', () => {
            service.buildMessageQuery();

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('m.files', 'files');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('files.file', 'file');
        });

        it('should join reply message and its files', () => {
            service.buildMessageQuery();

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'm.replyToMessage',
                'reply',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'reply.files',
                'replyFiles',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'replyFiles.file',
                'replyFile',
            );
        });

        it('should return the query builder', () => {
            const result = service.buildMessageQuery();

            expect(result).toBe(mockQueryBuilder);
        });
    });

    describe('hasMoreBefore', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getCount: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should return true when messages exist before first message', async () => {
            const firstMessage = { ...mockMessage, serialId: 100 };
            mockQueryBuilder.getCount.mockResolvedValue(1);

            const result = await service.hasMoreBefore('con-123', firstMessage);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.conId = :conId', {
                conId: 'con-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('m.serialId < :serialId', {
                serialId: 100,
            });
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('should return false when no messages exist before first message', async () => {
            const firstMessage = { ...mockMessage, serialId: 1 };
            mockQueryBuilder.getCount.mockResolvedValue(0);

            const result = await service.hasMoreBefore('con-123', firstMessage);

            expect(result).toBe(false);
        });
    });

    describe('hasMoreAfter', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getCount: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should return true when messages exist after last message', async () => {
            const lastMessage = { ...mockMessage, serialId: 50 };
            mockQueryBuilder.getCount.mockResolvedValue(1);

            const result = await service.hasMoreAfter('con-123', lastMessage);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.conId = :conId', {
                conId: 'con-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('m.serialId > :serialId', {
                serialId: 50,
            });
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('should return false when no messages exist after last message', async () => {
            const lastMessage = { ...mockMessage, serialId: 100 };
            mockQueryBuilder.getCount.mockResolvedValue(0);

            const result = await service.hasMoreAfter('con-123', lastMessage);

            expect(result).toBe(false);
        });
    });

    describe('findLastMessageByUser', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                getOne: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should find last message by user', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(mockMessage);

            const result = await service.findLastMessageByUser('con-123', 'user-123');

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.conId = :conId', {
                conId: 'con-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('sentBy.id = :userId', {
                userId: 'user-123',
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('m.serialId', 'DESC');
            expect(result).toEqual(mockMessage);
        });

        it('should return null when no message found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.findLastMessageByUser('con-123', 'user-123');

            expect(result).toBeNull();
        });
    });

    describe('findFirstMessageFromOthers', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                getOne: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should find first message from other users', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(mockMessage);

            const result = await service.findFirstMessageFromOthers('con-123', 'user-123');

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.conId = :conId', {
                conId: 'con-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('sentBy.id != :userId', {
                userId: 'user-123',
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('m.serialId', 'ASC');
            expect(result).toEqual(mockMessage);
        });

        it('should return null when no message found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.findFirstMessageFromOthers('con-123', 'user-123');

            expect(result).toBeNull();
        });
    });

    describe('resolveAnchorMessage', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getOne: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should return firstUnread when lastReadMessage provided and firstUnread exists', async () => {
            const lastReadMessage = {
                ...mockMessage,
                serialId: 10,
            } as SMessagesEntity;
            const firstUnread = {
                ...mockMessage,
                id: 'unread-msg',
                serialId: 11,
            } as SMessagesEntity;

            mockQueryBuilder.getOne.mockResolvedValue(firstUnread);

            const result = await service.resolveAnchorMessage('con-123', mockUser, lastReadMessage);

            expect(result).toEqual(firstUnread);
        });

        it('should return lastReadMessage when provided but no firstUnread exists', async () => {
            const lastReadMessage = {
                ...mockMessage,
                serialId: 10,
            } as SMessagesEntity;

            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.resolveAnchorMessage('con-123', mockUser, lastReadMessage);

            expect(result).toEqual(lastReadMessage);
        });

        it('should return lastAdminMessage when isAdmin=true, no lastReadMessage, and lastAdminMessage exists', async () => {
            const lastAdminMessage = {
                ...mockMessage,
                id: 'admin-msg',
            } as SMessagesEntity;

            jest.spyOn(service, 'findLastMessageByUser').mockResolvedValue(lastAdminMessage);

            const result = await service.resolveAnchorMessage('con-123', mockAdmin, null, true);

            expect(service.findLastMessageByUser).toHaveBeenCalledWith('con-123', mockAdmin.id);
            expect(result).toEqual(lastAdminMessage);
        });

        it('should return first message of conversation when isAdmin=true, no lastReadMessage, no lastAdminMessage', async () => {
            const firstMessage = {
                ...mockMessage,
                id: 'first-msg',
                serialId: 1,
            } as SMessagesEntity;

            jest.spyOn(service, 'findLastMessageByUser').mockResolvedValue(null);
            mockQueryBuilder.getOne.mockResolvedValue(firstMessage);

            const result = await service.resolveAnchorMessage('con-123', mockAdmin, null, true);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('m.serialId', 'ASC');
            expect(result).toEqual(firstMessage);
        });

        it('should return firstFromOthers when isAdmin=false, no lastReadMessage, and firstFromOthers exists', async () => {
            const firstFromOthers = {
                ...mockMessage,
                id: 'other-msg',
            } as SMessagesEntity;

            jest.spyOn(service, 'findFirstMessageFromOthers').mockResolvedValue(firstFromOthers);

            const result = await service.resolveAnchorMessage('con-123', mockUser, null, false);

            expect(service.findFirstMessageFromOthers).toHaveBeenCalledWith('con-123', mockUser.id);
            expect(result).toEqual(firstFromOthers);
        });

        it('should return last message of conversation when isAdmin=false, no lastReadMessage, no firstFromOthers', async () => {
            const lastMessage = {
                ...mockMessage,
                id: 'last-msg',
                serialId: 99,
            } as SMessagesEntity;

            jest.spyOn(service, 'findFirstMessageFromOthers').mockResolvedValue(null);
            mockQueryBuilder.getOne.mockResolvedValue(lastMessage);

            const result = await service.resolveAnchorMessage('con-123', mockUser, null, false);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('m.serialId', 'DESC');
            expect(result).toEqual(lastMessage);
        });
    });

    describe('resolveAdminLastReadMessage', () => {
        let sAdminConService: any;

        beforeEach(() => {
            sAdminConService = {
                associateAdminCon: jest.fn(),
            };

            const mockSupportsService = service['supportsService'];
            (mockSupportsService as any).sAdminConService = sAdminConService;
        });

        it('should return last read message when it exists', async () => {
            const lastReadMessage = { ...mockMessage, id: 'last-read-msg' };
            sAdminConService.associateAdminCon.mockResolvedValue({
                lastReadMessage,
            });

            const result = await service.resolveAdminLastReadMessage(mockConversation, mockAdmin);

            expect(sAdminConService.associateAdminCon).toHaveBeenCalledWith(
                mockAdmin,
                mockConversation,
            );
            expect(result).toEqual(lastReadMessage);
        });

        it('should return null when no last read message', async () => {
            sAdminConService.associateAdminCon.mockResolvedValue({
                lastReadMessage: null,
            });

            const result = await service.resolveAdminLastReadMessage(mockConversation, mockAdmin);

            expect(result).toBeNull();
        });

        it('should return null when lastReadMessage is undefined', async () => {
            sAdminConService.associateAdminCon.mockResolvedValue({});

            const result = await service.resolveAdminLastReadMessage(mockConversation, mockAdmin);

            expect(result).toBeNull();
        });
    });

    describe('emptyMessageResponse', () => {
        it('should return empty messages array', () => {
            const result = service.emptyMessageResponse();

            expect(result.messages).toEqual([]);
        });

        it('should return meta with hasMoreBefore false', () => {
            const result = service.emptyMessageResponse();

            expect(result.meta.hasMoreBefore).toBe(false);
        });

        it('should return meta with hasMoreAfter false', () => {
            const result = service.emptyMessageResponse();

            expect(result.meta.hasMoreAfter).toBe(false);
        });

        it('should have correct structure', () => {
            const result = service.emptyMessageResponse();

            expect(result).toEqual({
                messages: [],
                meta: {
                    hasMoreBefore: false,
                    hasMoreAfter: false,
                },
            });
        });
    });

    describe('findFirstUnreadMessage', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getOne: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should return first unread message without lastReadMessage', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(mockMessage);

            const result = await service.findFirstUnreadMessage('con-123');

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.conId = :conId', {
                conId: 'con-123',
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('m.serialId', 'DESC');
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
                'm.serialId > :serialId',
                expect.anything(),
            );
            expect(result).toEqual(mockMessage);
        });

        it('should filter by serialId when lastReadMessage is provided', async () => {
            const lastRead = {
                ...mockMessage,
                serialId: 42,
            } as SMessagesEntity;
            mockQueryBuilder.getOne.mockResolvedValue(mockMessage);

            await service.findFirstUnreadMessage('con-123', lastRead);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('m.serialId > :serialId', {
                serialId: 42,
            });
        });

        it('should return null when no unread message found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.findFirstUnreadMessage('con-123');

            expect(result).toBeNull();
        });
    });

    describe('resolveCursorMessage', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                getOne: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should resolve cursor message by id and conId', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(mockMessage);

            const result = await service.resolveCursorMessage('con-123', 'msg-123');

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('m.id = :cursorId', {
                cursorId: 'msg-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('m.conId = :conId', {
                conId: 'con-123',
            });
            expect(result).toEqual(mockMessage);
        });

        it('should return null when cursor message not found', async () => {
            mockQueryBuilder.getOne.mockResolvedValue(null);

            const result = await service.resolveCursorMessage('con-123', 'invalid-id');

            expect(result).toBeNull();
        });
    });

    describe('loadMessagesAround', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                distinct: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            };

            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            });
        });

        it('should load messages after anchor in correct order', async () => {
            const anchor = { ...mockMessage, serialId: 50 } as SMessagesEntity;
            const messages = [
                { ...mockMessage, serialId: 51 },
                { ...mockMessage, serialId: 52 },
            ] as SMessagesEntity[];
            mockQueryBuilder.getMany.mockResolvedValue(messages);

            const result = await service.loadMessagesAround('con-123', anchor, 'after', 20);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('m.serialId > :serialId', {
                serialId: 50,
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('m.serialId', 'ASC');
            expect(result).toEqual(messages);
        });

        it('should use default limit of 20', async () => {
            const anchor = { ...mockMessage, serialId: 10 } as SMessagesEntity;
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.loadMessagesAround('con-123', anchor, 'before');

            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
        });

        it('should return empty array when no messages found', async () => {
            const anchor = { ...mockMessage, serialId: 10 } as SMessagesEntity;
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.loadMessagesAround('con-123', anchor, 'after');

            expect(result).toEqual([]);
        });
    });

    describe('messageResponse', () => {
        beforeEach(() => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
            };
            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            });
            sTransformService.transformMessages = jest.fn().mockReturnValue([]);
        });

        it('should return emptyMessageResponse when messages array is empty', async () => {
            const result = await service.messageResponse([], 'con-123');

            expect(result).toEqual({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            });
        });

        it('should return response with messages and correct meta', async () => {
            const messages = [
                { ...mockMessage, id: 'msg-1', serialId: 1 },
                { ...mockMessage, id: 'msg-2', serialId: 2 },
            ] as SMessagesEntity[];
            const transformed = [{ id: 'msg-1' }, { id: 'msg-2' }];

            sTransformService.transformMessages.mockReturnValue(transformed);

            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(1),
            };
            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            });

            const result = await service.messageResponse(messages, 'con-123', 'before');

            expect(result).toMatchObject({
                messages: transformed,
                meta: expect.objectContaining({
                    direction: 'before',
                    cursorBefore: 'msg-1',
                    cursorAfter: 'msg-2',
                    hasMoreBefore: true,
                    hasMoreAfter: true,
                }),
            });
        });

        it('should default direction to "initial" when not provided', async () => {
            const messages = [{ ...mockMessage, serialId: 1 }] as SMessagesEntity[];
            sTransformService.transformMessages.mockReturnValue([]);

            const result = (await service.messageResponse(messages, 'con-123')) as any;

            expect(result.meta.direction).toBe('initial');
        });
    });

    describe('loadInitial', () => {
        beforeEach(() => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                distinct: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
                getMany: jest.fn().mockResolvedValue([]),
                getCount: jest.fn().mockResolvedValue(0),
            };
            sMessageRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            });
            sTransformService.transformMessages = jest.fn().mockReturnValue([]);
        });

        it('should return emptyMessageResponse when no anchor found', async () => {
            jest.spyOn(service, 'resolveAnchorMessage').mockResolvedValue(null);

            const result = await service.loadInitial(mockConversation, mockUser, 20);

            expect(result).toEqual({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            });
        });

        it('should load messages before anchor when anchor exists', async () => {
            const anchor = { ...mockMessage, serialId: 10 } as SMessagesEntity;
            jest.spyOn(service, 'resolveAnchorMessage').mockResolvedValue(anchor);
            jest.spyOn(service, 'loadMessagesAround').mockResolvedValue([anchor]);
            jest.spyOn(service, 'messageResponse').mockResolvedValue({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            } as any);

            await service.loadInitial(mockConversation, mockUser, 20);

            expect(service.loadMessagesAround).toHaveBeenCalledWith(
                'con-123',
                anchor,
                'before',
                20,
            );
        });

        it('should pass lastReadMessage to resolveAnchorMessage', async () => {
            const lastRead = { ...mockMessage, serialId: 5 } as SMessagesEntity;
            jest.spyOn(service, 'resolveAnchorMessage').mockResolvedValue(null);

            await service.loadInitial(mockConversation, mockUser, 20, lastRead);

            expect(service.resolveAnchorMessage).toHaveBeenCalledWith(
                'con-123',
                mockUser,
                lastRead,
            );
        });
    });

    describe('loadInitialForAdmin', () => {
        it('should return emptyMessageResponse when no lastReadMessage and no first message', async () => {
            sMessageRepo.findOne.mockResolvedValue(null);
            sTransformService.messageFullRelations = jest.fn().mockReturnValue([]);

            const result = await service.loadInitialForAdmin(mockConversation, mockAdmin, 20, null);

            expect(result).toEqual({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            });
        });

        it('should return messageResponse with first message when no lastReadMessage', async () => {
            const firstMessage = {
                ...mockMessage,
                serialId: 1,
            } as SMessagesEntity;
            sMessageRepo.findOne.mockResolvedValue(firstMessage);
            sTransformService.messageFullRelations = jest.fn().mockReturnValue([]);
            jest.spyOn(service, 'messageResponse').mockResolvedValue({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            } as any);

            await service.loadInitialForAdmin(mockConversation, mockAdmin, 20, null);

            expect(service.messageResponse).toHaveBeenCalledWith(
                [firstMessage],
                'con-123',
                'before',
            );
        });

        it('should delegate to loadInitial when lastReadMessage is provided', async () => {
            const lastRead = { ...mockMessage, serialId: 5 } as SMessagesEntity;
            jest.spyOn(service, 'loadInitial').mockResolvedValue({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            } as any);

            await service.loadInitialForAdmin(mockConversation, mockAdmin, 20, lastRead);

            expect(service.loadInitial).toHaveBeenCalledWith(
                mockConversation,
                mockAdmin,
                20,
                lastRead,
            );
        });
    });

    describe('loadMore', () => {
        it('should return emptyMessageResponse when cursor message not found', async () => {
            jest.spyOn(service, 'resolveCursorMessage').mockResolvedValue(null);

            const result = await service.loadMore('con-123', 'invalid-cursor', 'before', 20);

            expect(result).toEqual({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            });
        });

        it('should load messages around cursor and return response', async () => {
            const anchor = { ...mockMessage, serialId: 50 } as SMessagesEntity;
            const messages = [anchor];
            jest.spyOn(service, 'resolveCursorMessage').mockResolvedValue(anchor);
            jest.spyOn(service, 'loadMessagesAround').mockResolvedValue(messages);
            jest.spyOn(service, 'messageResponse').mockResolvedValue({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            } as any);

            await service.loadMore('con-123', 'msg-123', 'before', 20);

            expect(service.resolveCursorMessage).toHaveBeenCalledWith('con-123', 'msg-123');
            expect(service.loadMessagesAround).toHaveBeenCalledWith(
                'con-123',
                anchor,
                'before',
                20,
            );
            expect(service.messageResponse).toHaveBeenCalledWith(messages, 'con-123');
        });

        it('should work with direction after', async () => {
            const anchor = { ...mockMessage, serialId: 50 } as SMessagesEntity;
            jest.spyOn(service, 'resolveCursorMessage').mockResolvedValue(anchor);
            jest.spyOn(service, 'loadMessagesAround').mockResolvedValue([]);
            jest.spyOn(service, 'messageResponse').mockResolvedValue({
                messages: [],
                meta: { hasMoreBefore: false, hasMoreAfter: false },
            } as any);

            await service.loadMore('con-123', 'msg-123', 'after', 10);

            expect(service.loadMessagesAround).toHaveBeenCalledWith('con-123', anchor, 'after', 10);
        });
    });
});
