import { Test, TestingModule } from '@nestjs/testing';
import { TransformSEntitiesService } from './transform-s-entities.service';
import { SupportsService } from './supports.service';
import { SConEntity, SMessagesEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('TransformSEntitiesService', () => {
    let service: TransformSEntitiesService;
    let supportsService: any;

    const mockTransformFiles = jest.fn();

    const mockSupportsService = {
        transformService: {
            transformFiles: mockTransformFiles,
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransformSEntitiesService,
                {
                    provide: SupportsService,
                    useValue: mockSupportsService,
                },
            ],
        }).compile();

        service = module.get<TransformSEntitiesService>(TransformSEntitiesService);
        supportsService = module.get(SupportsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('adminConEntities', () => {
        it('should return admin conversation entities array', () => {
            const result = service.adminConEntities();
            expect(result).toEqual(['admin', 'conversation', 'lastReadMessage']);
        });

        it('should return array with correct length', () => {
            const result = service.adminConEntities();
            expect(result).toHaveLength(3);
        });

        it('should return same array structure each call', () => {
            const result1 = service.adminConEntities();
            const result2 = service.adminConEntities();
            expect(result1).toEqual(result2);
        });
    });

    describe('messageFullRelations', () => {
        it('should return message full relations array', () => {
            const result = service.messageFullRelations();
            expect(result).toEqual([
                'sentBy',
                'sentBy.avatar',
                'sentBy.avatar.file',
                'files',
                'files.file',
                'replyToMessage',
                'replyToMessage.files',
                'replyToMessage.files.file',
            ]);
        });

        it('should return array with correct length', () => {
            const result = service.messageFullRelations();
            expect(result).toHaveLength(8);
        });

        it('should include all required relations for complete message loading', () => {
            const result = service.messageFullRelations();
            expect(result).toContain('sentBy');
            expect(result).toContain('sentBy.avatar');
            expect(result).toContain('sentBy.avatar.file');
            expect(result).toContain('files');
            expect(result).toContain('files.file');
            expect(result).toContain('replyToMessage');
            expect(result).toContain('replyToMessage.files');
            expect(result).toContain('replyToMessage.files.file');
        });
    });

    describe('conDetailsEntity', () => {
        it('should return conversation details entities array', () => {
            const result = service.conDetailsEntity();
            expect(result).toEqual(['createdBy']);
        });

        it('should return array with correct length', () => {
            const result = service.conDetailsEntity();
            expect(result).toHaveLength(1);
        });
    });

    describe('openChatEntities', () => {
        it('should return open chat entities array', () => {
            const result = service.openChatEntities();
            expect(result).toEqual(['lastReadMessage', 'lastMessage']);
        });

        it('should return array with correct length', () => {
            const result = service.openChatEntities();
            expect(result).toHaveLength(2);
        });

        it('should return same array each call', () => {
            const result1 = service.openChatEntities();
            const result2 = service.openChatEntities();
            expect(result1).toEqual(result2);
        });
    });

    describe('conEntities', () => {
        it('should return conversation entities array', () => {
            const result = service.conEntities();
            expect(result).toEqual([
                'code',
                'lastMessage',
                'createdBy',
                'lastMessage.files',
                'lastMessage.sentBy',
            ]);
        });

        it('should return array with correct length', () => {
            const result = service.conEntities();
            expect(result).toHaveLength(5);
        });

        it('should include nested relations for lastMessage', () => {
            const result = service.conEntities();
            expect(result).toContain('lastMessage.files');
            expect(result).toContain('lastMessage.sentBy');
        });
    });

    describe('messageSentEntities', () => {
        it('should return message sent entities array', () => {
            const result = service.messageSentEntities();
            expect(result).toEqual([
                'replyToMessage',
                'replyToMessage.files',
                'replyToMessage.files.file',
                'files',
                'files.file',
                'sentBy',
                'sentBy.avatar',
                'sentBy.avatar.file',
            ]);
        });

        it('should return array with correct length', () => {
            const result = service.messageSentEntities();
            expect(result).toHaveLength(8);
        });

        it('should include all nested relations', () => {
            const result = service.messageSentEntities();
            expect(result).toContain('replyToMessage.files.file');
            expect(result).toContain('sentBy.avatar.file');
        });
    });

    describe('markAsReadConEntities', () => {
        it('should return mark as read conversation entities array', () => {
            const result = service.markAsReadConEntities();
            expect(result).toEqual(['lastMessage', 'lastMessage.files', 'lastMessage.sentBy']);
        });

        it('should return array with correct length', () => {
            const result = service.markAsReadConEntities();
            expect(result).toHaveLength(3);
        });
    });

    describe('transformSentBy', () => {
        it('should transform sentBy with avatar', () => {
            const mockFile = {
                id: 'file-1',
                url: 'https://example.com/avatar.jpg',
                filename: 'avatar.jpg',
            };
            mockTransformFiles.mockReturnValue(mockFile);

            const message = {
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: {
                        file: { id: 'file-1', path: 'avatar.jpg' },
                    },
                },
            } as SMessagesEntity;

            const result = service.transformSentBy(message);

            expect(result).toEqual({
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: mockFile,
                },
            });
            expect(mockTransformFiles).toHaveBeenCalledWith({
                id: 'file-1',
                path: 'avatar.jpg',
            });
            expect(mockTransformFiles).toHaveBeenCalledTimes(1);
        });

        it('should transform sentBy without avatar', () => {
            const message = {
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: null,
                },
            } as any;

            const result = service.transformSentBy(message);

            expect(result).toEqual({
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: null,
                },
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should return null when sentBy is null', () => {
            const message = {
                sentBy: null,
            } as any;

            const result = service.transformSentBy(message);

            expect(result).toEqual({
                sentBy: null,
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should return null when sentBy is undefined', () => {
            const message = {} as SMessagesEntity;

            const result = service.transformSentBy(message);

            expect(result).toEqual({
                sentBy: null,
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });
    });

    describe('transformMFiles', () => {
        it('should transform message files', () => {
            const mockFile1 = {
                id: 'file-1',
                url: 'https://example.com/file1.pdf',
                filename: 'doc1.pdf',
            };
            const mockFile2 = {
                id: 'file-2',
                url: 'https://example.com/file2.jpg',
                filename: 'image.jpg',
            };

            mockTransformFiles.mockReturnValueOnce(mockFile1).mockReturnValueOnce(mockFile2);

            const message = {
                files: [
                    { file: { id: 'file-1', path: 'doc1.pdf' } },
                    { file: { id: 'file-2', path: 'image.jpg' } },
                ],
            } as SMessagesEntity;

            const result = service.transformMFiles(message);

            expect(result).toEqual({
                files: [mockFile1, mockFile2],
            });
            expect(mockTransformFiles).toHaveBeenCalledTimes(2);
            expect(mockTransformFiles).toHaveBeenCalledWith({
                id: 'file-1',
                path: 'doc1.pdf',
            });
            expect(mockTransformFiles).toHaveBeenCalledWith({
                id: 'file-2',
                path: 'image.jpg',
            });
        });

        it('should return empty array when files is null', () => {
            const message = {
                files: null,
            } as any;

            const result = service.transformMFiles(message);

            expect(result).toEqual({
                files: [],
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should return empty array when files is undefined', () => {
            const message = {} as SMessagesEntity;

            const result = service.transformMFiles(message);

            expect(result).toEqual({
                files: [],
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should handle empty files array', () => {
            const message = {
                files: [],
            } as any;

            const result = service.transformMFiles(message);

            expect(result).toEqual({
                files: [],
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });
    });

    describe('transformMessage', () => {
        it('should transform complete message with all properties', () => {
            const mockFile = {
                id: 'file-1',
                url: 'https://example.com/file.jpg',
            };
            const mockAvatar = {
                id: 'avatar-1',
                url: 'https://example.com/avatar.jpg',
            };

            mockTransformFiles
                .mockReturnValueOnce(mockFile)
                .mockReturnValueOnce(mockAvatar)
                .mockReturnValueOnce(mockFile);

            const message = {
                id: 'msg-1',
                content: 'Hello world',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-02T10:00:00Z'),
                files: [{ file: { id: 'file-1' } }],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: {
                        file: { id: 'avatar-1' },
                    },
                },
                replyToMessage: {
                    id: 'msg-0',
                    content: 'Original message',
                    files: [{ file: { id: 'file-1' } }],
                },
            } as any;

            const result = service.transformMessage(message);

            expect(result).toEqual({
                id: 'msg-1',
                content: 'Hello world',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-02T10:00:00Z'),
                files: [mockFile],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: mockAvatar,
                },
                replyToMessage: {
                    id: 'msg-0',
                    content: 'Original message',
                    files: [mockFile],
                },
            });

            expect(mockTransformFiles).toHaveBeenCalledTimes(3);
        });

        it('should transform message without replyToMessage', () => {
            const mockFile = {
                id: 'file-1',
                url: 'https://example.com/file.jpg',
            };
            const mockAvatar = {
                id: 'avatar-1',
                url: 'https://example.com/avatar.jpg',
            };

            mockTransformFiles.mockReturnValueOnce(mockFile).mockReturnValueOnce(mockAvatar);

            const message = {
                id: 'msg-1',
                content: 'Hello world',
                isModified: true,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-02T10:00:00Z'),
                files: [{ file: { id: 'file-1' } }],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: {
                        file: { id: 'avatar-1' },
                    },
                },
                replyToMessage: null,
            } as any;

            const result = service.transformMessage(message);

            expect(result).toEqual({
                id: 'msg-1',
                content: 'Hello world',
                isModified: true,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-02T10:00:00Z'),
                files: [mockFile],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: mockAvatar,
                },
                replyToMessage: null,
            });
        });

        it('should transform message with minimal properties', () => {
            const message = {
                id: 'msg-1',
                content: 'Simple message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: null,
                sentBy: null,
                replyToMessage: null,
            } as any;

            const result = service.transformMessage(message);

            expect(result).toEqual({
                id: 'msg-1',
                content: 'Simple message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: [],
                sentBy: null,
                replyToMessage: null,
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should transform message with replyToMessage but no files', () => {
            const mockAvatar = {
                id: 'avatar-1',
                url: 'https://example.com/avatar.jpg',
            };

            mockTransformFiles.mockReturnValueOnce(mockAvatar);

            const message = {
                id: 'msg-1',
                content: 'Reply message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: null,
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: {
                        file: { id: 'avatar-1' },
                    },
                },
                replyToMessage: {
                    id: 'msg-0',
                    content: 'Original',
                    files: null,
                },
            } as any;

            const result = service.transformMessage(message);

            expect(result).toEqual({
                id: 'msg-1',
                content: 'Reply message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: [],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: mockAvatar,
                },
                replyToMessage: {
                    id: 'msg-0',
                    content: 'Original',
                    files: [],
                },
            });
            expect(mockTransformFiles).toHaveBeenCalledTimes(1);
        });

        it('should transform message with replyToMessage having files', () => {
            const mockFile1 = { id: 'file-1' };
            const mockFile2 = { id: 'file-2' };
            const mockAvatar = { id: 'avatar-1' };

            mockTransformFiles
                .mockReturnValueOnce(mockFile1)
                .mockReturnValueOnce(mockAvatar)
                .mockReturnValueOnce(mockFile2);

            const message = {
                id: 'msg-1',
                content: 'Main',
                isModified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                files: [{ file: { id: 'file-1' } }],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John',
                    avatar: { file: { id: 'avatar-1' } },
                },
                replyToMessage: {
                    id: 'msg-0',
                    content: 'Reply',
                    files: [{ file: { id: 'file-2' } }],
                },
            } as any;

            const result = service.transformMessage(message);

            expect(result.files).toEqual([mockFile1]);
            expect(result.replyToMessage?.files).toEqual([mockFile2]);
        });
    });

    describe('transformMessages', () => {
        it('should transform multiple messages', () => {
            const mockFile1 = {
                id: 'file-1',
                url: 'https://example.com/file1.pdf',
            };
            const mockFile2 = {
                id: 'file-2',
                url: 'https://example.com/file2.jpg',
            };
            const mockAvatar1 = {
                id: 'avatar-1',
                url: 'https://example.com/avatar1.jpg',
            };
            const mockAvatar2 = {
                id: 'avatar-2',
                url: 'https://example.com/avatar2.jpg',
            };

            mockTransformFiles
                .mockReturnValueOnce(mockFile1)
                .mockReturnValueOnce(mockAvatar1)
                .mockReturnValueOnce(mockFile2)
                .mockReturnValueOnce(mockAvatar2);

            const messages = [
                {
                    id: 'msg-1',
                    content: 'First message',
                    isModified: false,
                    createdAt: new Date('2024-01-01T10:00:00Z'),
                    updatedAt: new Date('2024-01-01T10:00:00Z'),
                    files: [{ file: { id: 'file-1' } }],
                    sentBy: {
                        id: 'user-1',
                        fullname: 'John Doe',
                        avatar: {
                            file: { id: 'avatar-1' },
                        },
                    },
                    replyToMessage: null,
                },
                {
                    id: 'msg-2',
                    content: 'Second message',
                    isModified: true,
                    createdAt: new Date('2024-01-02T10:00:00Z'),
                    updatedAt: new Date('2024-01-03T10:00:00Z'),
                    files: [{ file: { id: 'file-2' } }],
                    sentBy: {
                        id: 'user-2',
                        fullname: 'Jane Smith',
                        avatar: {
                            file: { id: 'avatar-2' },
                        },
                    },
                    replyToMessage: null,
                },
            ] as any[];

            const result = service.transformMessages(messages);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'msg-1',
                content: 'First message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: [mockFile1],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                    avatar: mockAvatar1,
                },
                replyToMessage: null,
            });
            expect(result[1]).toEqual({
                id: 'msg-2',
                content: 'Second message',
                isModified: true,
                createdAt: new Date('2024-01-02T10:00:00Z'),
                updatedAt: new Date('2024-01-03T10:00:00Z'),
                files: [mockFile2],
                sentBy: {
                    id: 'user-2',
                    fullname: 'Jane Smith',
                    avatar: mockAvatar2,
                },
                replyToMessage: null,
            });

            expect(mockTransformFiles).toHaveBeenCalledTimes(4);
        });

        it('should handle empty messages array', () => {
            const messages = [] as SMessagesEntity[];

            const result = service.transformMessages(messages);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should transform single message in array', () => {
            const message = {
                id: 'msg-1',
                content: 'Single message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: null,
                sentBy: null,
                replyToMessage: null,
            } as any;

            const result = service.transformMessages([message]);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'msg-1',
                content: 'Single message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: [],
                sentBy: null,
                replyToMessage: null,
            });
            expect(mockTransformFiles).not.toHaveBeenCalled();
        });

        it('should transform messages with varying properties', () => {
            const mockAvatar = {
                id: 'avatar-1',
                url: 'https://example.com/avatar.jpg',
            };

            mockTransformFiles.mockReturnValue(mockAvatar);

            const messages = [
                {
                    id: 'msg-1',
                    content: 'With avatar',
                    isModified: false,
                    createdAt: new Date('2024-01-01T10:00:00Z'),
                    updatedAt: new Date('2024-01-01T10:00:00Z'),
                    files: null,
                    sentBy: {
                        id: 'user-1',
                        fullname: 'John Doe',
                        avatar: {
                            file: { id: 'avatar-1' },
                        },
                    },
                    replyToMessage: null,
                },
                {
                    id: 'msg-2',
                    content: 'Without avatar',
                    isModified: false,
                    createdAt: new Date('2024-01-02T10:00:00Z'),
                    updatedAt: new Date('2024-01-02T10:00:00Z'),
                    files: null,
                    sentBy: {
                        id: 'user-2',
                        fullname: 'Jane Smith',
                        avatar: null,
                    },
                    replyToMessage: null,
                },
            ] as any[];

            const result = service.transformMessages(messages);

            expect(result).toHaveLength(2);
            expect(result[0].sentBy?.avatar).toEqual(mockAvatar);
            expect(result[1].sentBy?.avatar).toBeNull();
            expect(mockTransformFiles).toHaveBeenCalledTimes(1);
        });

        it('should transform correct number of messages', () => {
            const messages = [
                {
                    id: 'msg-1',
                    content: 'Message 1',
                    isModified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    files: null,
                    sentBy: null,
                    replyToMessage: null,
                },
                {
                    id: 'msg-2',
                    content: 'Message 2',
                    isModified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    files: null,
                    sentBy: null,
                    replyToMessage: null,
                },
                {
                    id: 'msg-3',
                    content: 'Message 3',
                    isModified: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    files: null,
                    sentBy: null,
                    replyToMessage: null,
                },
            ] as any[];

            const result = service.transformMessages(messages);

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('msg-1');
            expect(result[1].id).toBe('msg-2');
            expect(result[2].id).toBe('msg-3');
        });
    });

    describe('transformLastMessage', () => {
        it('should transform last message with files', () => {
            const message = {
                id: 'msg-1',
                content: 'Test message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-02T10:00:00Z'),
                files: [{ file: { id: 'file-1' } }, { file: { id: 'file-2' } }],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                },
            } as SMessagesEntity;

            const result = service.transformLastMessage(message);

            expect(result).toEqual({
                id: 'msg-1',
                content: 'Test message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-02T10:00:00Z'),
                hasFiles: true,
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                },
            });
        });

        it('should transform last message without files', () => {
            const message = {
                id: 'msg-2',
                content: 'No files message',
                isModified: true,
                createdAt: new Date('2024-01-03T10:00:00Z'),
                updatedAt: new Date('2024-01-04T10:00:00Z'),
                files: [],
                sentBy: {
                    id: 'user-2',
                    fullname: 'Jane Smith',
                },
            } as any;

            const result = service.transformLastMessage(message);

            expect(result).toEqual({
                id: 'msg-2',
                content: 'No files message',
                isModified: true,
                createdAt: new Date('2024-01-03T10:00:00Z'),
                updatedAt: new Date('2024-01-04T10:00:00Z'),
                hasFiles: false,
                sentBy: {
                    id: 'user-2',
                    fullname: 'Jane Smith',
                },
            });
        });

        it('should transform last message with null files', () => {
            const message = {
                id: 'msg-3',
                content: 'Null files message',
                isModified: false,
                createdAt: new Date('2024-01-05T10:00:00Z'),
                updatedAt: new Date('2024-01-05T10:00:00Z'),
                files: null,
                sentBy: {
                    id: 'user-3',
                    fullname: 'Bob Johnson',
                },
            } as any;

            const result = service.transformLastMessage(message);

            expect(result).toEqual({
                id: 'msg-3',
                content: 'Null files message',
                isModified: false,
                createdAt: new Date('2024-01-05T10:00:00Z'),
                updatedAt: new Date('2024-01-05T10:00:00Z'),
                hasFiles: false,
                sentBy: {
                    id: 'user-3',
                    fullname: 'Bob Johnson',
                },
            });
        });

        it('should transform last message with undefined files', () => {
            const message = {
                id: 'msg-4',
                content: 'Undefined files',
                isModified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                files: undefined,
                sentBy: {
                    id: 'user-4',
                    fullname: 'Alice',
                },
            } as any;

            const result = service.transformLastMessage(message);

            expect(result.hasFiles).toBe(false);
        });

        it('should include all required fields in transformed message', () => {
            const message = {
                id: 'msg-5',
                content: 'Complete',
                isModified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                files: [],
                sentBy: {
                    id: 'user-5',
                    fullname: 'Charlie',
                },
            } as any;

            const result = service.transformLastMessage(message);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('content');
            expect(result).toHaveProperty('isModified');
            expect(result).toHaveProperty('createdAt');
            expect(result).toHaveProperty('updatedAt');
            expect(result).toHaveProperty('hasFiles');
            expect(result).toHaveProperty('sentBy');
            expect(result.sentBy).toHaveProperty('id');
            expect(result.sentBy).toHaveProperty('fullname');
        });
    });

    describe('transformCon', () => {
        it('should transform conversation with last message, unread count, and createdBy', () => {
            const conversation = {
                id: 'con-1',
                label: '12345',
                color: '#FF5733',
                createdBy: {
                    id: 'creator-1',
                    fullname: 'Creator Name',
                    email: 'creator@example.com',
                },
            } as SConEntity;

            const lastMessage = {
                id: 'msg-1',
                content: 'Latest message',
                isModified: false,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z'),
                files: [{ file: { id: 'file-1' } }],
                sentBy: {
                    id: 'user-1',
                    fullname: 'John Doe',
                },
            } as SMessagesEntity;

            const result = service.transformCon(conversation, lastMessage, 5);

            expect(result).toEqual({
                id: 'con-1',
                label: 'Ticket id: #12345',
                lastMessage: {
                    id: 'msg-1',
                    content: 'Latest message',
                    isModified: false,
                    createdAt: new Date('2024-01-01T10:00:00Z'),
                    updatedAt: new Date('2024-01-01T10:00:00Z'),
                    hasFiles: true,
                    sentBy: {
                        id: 'user-1',
                        fullname: 'John Doe',
                    },
                },
                color: '#FF5733',
                createdBy: {
                    id: 'creator-1',
                    fullname: 'Creator Name',
                    email: 'creator@example.com',
                },
                unreadCount: 5,
            });
        });

        it('should transform conversation without last message but with createdBy', () => {
            const conversation = {
                id: 'con-2',
                label: '67890',
                color: '#3498DB',
                createdBy: {
                    id: 'creator-2',
                    fullname: 'Another Creator',
                    email: 'another@example.com',
                },
            } as SConEntity;

            const result = service.transformCon(conversation, undefined, 3);

            expect(result).toEqual({
                id: 'con-2',
                label: 'Ticket id: #67890',
                lastMessage: null,
                color: '#3498DB',
                createdBy: {
                    id: 'creator-2',
                    fullname: 'Another Creator',
                    email: 'another@example.com',
                },
                unreadCount: 3,
            });
        });

        it('should transform conversation with last message but zero unread count and no createdBy', () => {
            const conversation = {
                id: 'con-3',
                label: 'ABC123',
                color: '#2ECC71',
                createdBy: null,
            } as any;

            const lastMessage = {
                id: 'msg-2',
                content: 'Read message',
                isModified: true,
                createdAt: new Date('2024-01-02T10:00:00Z'),
                updatedAt: new Date('2024-01-03T10:00:00Z'),
                files: null,
                sentBy: {
                    id: 'user-2',
                    fullname: 'Jane Smith',
                },
            } as any;

            const result = service.transformCon(conversation, lastMessage, 0);

            expect(result).toEqual({
                id: 'con-3',
                label: 'Ticket id: #ABC123',
                lastMessage: {
                    id: 'msg-2',
                    content: 'Read message',
                    isModified: true,
                    createdAt: new Date('2024-01-02T10:00:00Z'),
                    updatedAt: new Date('2024-01-03T10:00:00Z'),
                    hasFiles: false,
                    sentBy: {
                        id: 'user-2',
                        fullname: 'Jane Smith',
                    },
                },
                color: '#2ECC71',
                createdBy: null,
                unreadCount: 0,
            });
        });

        it('should transform conversation without last message and with default unread count', () => {
            const conversation = {
                id: 'con-4',
                label: 'XYZ789',
                color: '#9B59B6',
                createdBy: undefined,
            } as any;

            const result = service.transformCon(conversation);

            expect(result).toEqual({
                id: 'con-4',
                label: 'Ticket id: #XYZ789',
                lastMessage: null,
                color: '#9B59B6',
                createdBy: null,
                unreadCount: 0,
            });
        });

        it('should handle conversation with missing color', () => {
            const conversation = {
                id: 'con-5',
                label: 'NOCOLOR',
                createdBy: null,
            } as any;

            const result = service.transformCon(conversation);

            expect(result).toEqual({
                id: 'con-5',
                label: 'Ticket id: #NOCOLOR',
                lastMessage: null,
                color: undefined,
                createdBy: null,
                unreadCount: 0,
            });
        });

        it('should handle conversation with numeric label', () => {
            const conversation = {
                id: 'con-6',
                label: 123456,
                color: '#FF5733',
                createdBy: null,
            } as any;

            const result = service.transformCon(conversation);

            expect(result.label).toBe('Ticket id: #123456');
        });
    });

    describe('transformConsWithUnread', () => {
        it('should transform multiple conversations with unread counts', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '12345',
                    color: '#FF5733',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Message 1',
                        isModified: false,
                        createdAt: new Date('2024-01-01T10:00:00Z'),
                        updatedAt: new Date('2024-01-01T10:00:00Z'),
                        files: [{ file: { id: 'file-1' } }],
                        sentBy: {
                            id: 'user-1',
                            fullname: 'John Doe',
                        },
                    },
                    createdBy: {
                        id: 'creator-1',
                        fullname: 'Creator 1',
                        email: 'creator1@example.com',
                    },
                },
                {
                    id: 'con-2',
                    label: '67890',
                    color: '#3498DB',
                    lastMessage: {
                        id: 'msg-2',
                        content: 'Message 2',
                        isModified: true,
                        createdAt: new Date('2024-01-02T10:00:00Z'),
                        updatedAt: new Date('2024-01-02T10:00:00Z'),
                        files: null,
                        sentBy: {
                            id: 'user-2',
                            fullname: 'Jane Smith',
                        },
                    },
                    createdBy: {
                        id: 'creator-2',
                        fullname: 'Creator 2',
                        email: 'creator2@example.com',
                    },
                },
            ] as SConEntity[];

            const raw = [{ unreadCount: '3' }, { unreadCount: '7' }];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'con-1',
                label: 'Ticket id: #12345',
                lastMessage: {
                    id: 'msg-1',
                    content: 'Message 1',
                    isModified: false,
                    createdAt: new Date('2024-01-01T10:00:00Z'),
                    updatedAt: new Date('2024-01-01T10:00:00Z'),
                    hasFiles: true,
                    sentBy: {
                        id: 'user-1',
                        fullname: 'John Doe',
                    },
                },
                color: '#FF5733',
                createdBy: {
                    id: 'creator-1',
                    fullname: 'Creator 1',
                    email: 'creator1@example.com',
                },
                unreadCount: 3,
            });
            expect(result[1]).toEqual({
                id: 'con-2',
                label: 'Ticket id: #67890',
                lastMessage: {
                    id: 'msg-2',
                    content: 'Message 2',
                    isModified: true,
                    createdAt: new Date('2024-01-02T10:00:00Z'),
                    updatedAt: new Date('2024-01-02T10:00:00Z'),
                    hasFiles: false,
                    sentBy: {
                        id: 'user-2',
                        fullname: 'Jane Smith',
                    },
                },
                color: '#3498DB',
                createdBy: {
                    id: 'creator-2',
                    fullname: 'Creator 2',
                    email: 'creator2@example.com',
                },
                unreadCount: 7,
            });
        });

        it('should handle conversations with missing unread counts in raw data', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '11111',
                    color: '#E74C3C',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Test',
                        isModified: false,
                        createdAt: new Date('2024-01-01T10:00:00Z'),
                        updatedAt: new Date('2024-01-01T10:00:00Z'),
                        files: null,
                        sentBy: {
                            id: 'user-1',
                            fullname: 'User One',
                        },
                    },
                    createdBy: null,
                },
            ] as any;

            const raw = [{}];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result).toEqual([
                {
                    id: 'con-1',
                    label: 'Ticket id: #11111',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Test',
                        isModified: false,
                        createdAt: new Date('2024-01-01T10:00:00Z'),
                        updatedAt: new Date('2024-01-01T10:00:00Z'),
                        hasFiles: false,
                        sentBy: {
                            id: 'user-1',
                            fullname: 'User One',
                        },
                    },
                    color: '#E74C3C',
                    createdBy: null,
                    unreadCount: 0,
                },
            ]);
        });

        it('should handle empty conversations array', () => {
            const conversations = [] as SConEntity[];
            const raw = [];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result).toEqual([]);
        });

        it('should handle null unread counts', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '22222',
                    color: '#9B59B6',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Message',
                        isModified: false,
                        createdAt: new Date('2024-01-01T10:00:00Z'),
                        updatedAt: new Date('2024-01-01T10:00:00Z'),
                        files: [],
                        sentBy: {
                            id: 'user-1',
                            fullname: 'User',
                        },
                    },
                    createdBy: null,
                },
            ] as any[];

            const raw = [{ unreadCount: null }];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result).toEqual([
                {
                    id: 'con-1',
                    label: 'Ticket id: #22222',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Message',
                        isModified: false,
                        createdAt: new Date('2024-01-01T10:00:00Z'),
                        updatedAt: new Date('2024-01-01T10:00:00Z'),
                        hasFiles: false,
                        sentBy: {
                            id: 'user-1',
                            fullname: 'User',
                        },
                    },
                    color: '#9B59B6',
                    createdBy: null,
                    unreadCount: 0,
                },
            ]);
        });

        it('should handle undefined unread counts', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '33333',
                    color: '#F1C40F',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Message',
                        isModified: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        files: [],
                        sentBy: { id: 'user-1', fullname: 'User' },
                    },
                    createdBy: null,
                },
            ] as any[];

            const raw = [{ unreadCount: undefined }];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result[0].unreadCount).toBe(0);
        });

        it('should handle raw array shorter than conversations array', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '111',
                    color: '#FF5733',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Msg 1',
                        isModified: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        files: [],
                        sentBy: { id: 'user-1', fullname: 'User 1' },
                    },
                    createdBy: null,
                },
                {
                    id: 'con-2',
                    label: '222',
                    color: '#3498DB',
                    lastMessage: {
                        id: 'msg-2',
                        content: 'Msg 2',
                        isModified: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        files: [],
                        sentBy: { id: 'user-2', fullname: 'User 2' },
                    },
                    createdBy: null,
                },
            ] as any[];

            const raw = [{ unreadCount: '5' }];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result[0].unreadCount).toBe(5);
            expect(result[1].unreadCount).toBe(0);
        });

        it('should handle conversations with missing lastMessage', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '44444',
                    color: '#27AE60',
                    lastMessage: null,
                    createdBy: null,
                },
            ] as any[];

            const raw = [{ unreadCount: '10' }];

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result[0].lastMessage).toBeNull();
            expect(result[0].unreadCount).toBe(10);
        });

        it('should handle non-string unread counts', () => {
            const conversations = [
                {
                    id: 'con-1',
                    label: '55555',
                    color: '#E67E22',
                    lastMessage: {
                        id: 'msg-1',
                        content: 'Test',
                        isModified: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        files: [],
                        sentBy: { id: 'user-1', fullname: 'User' },
                    },
                    createdBy: null,
                },
            ] as any[];

            const raw = [{ unreadCount: 42 }]; // Number instead of string

            const result = service.transformConsWithUnread(conversations, raw);

            expect(result[0].unreadCount).toBe(42);
        });
    });

    describe('dependency injection', () => {
        it('should have SupportsService injected', () => {
            expect(service['supportsService']).toBeDefined();
            expect(service['supportsService']).toBe(mockSupportsService);
        });

        it('should access transformService from SupportsService', () => {
            expect(supportsService.transformService).toBeDefined();
            expect(supportsService.transformService).toBe(mockSupportsService.transformService);
        });

        it('should access transformFiles from transformService', () => {
            expect(supportsService.transformService.transformFiles).toBeDefined();
            expect(supportsService.transformService.transformFiles).toBe(mockTransformFiles);
        });

        it('should call transformFiles in transformSentBy', () => {
            const message = {
                sentBy: {
                    avatar: {
                        file: { id: 'test' },
                    },
                },
            } as any;

            service.transformSentBy(message);
            expect(mockTransformFiles).toHaveBeenCalled();
        });

        it('should call transformFiles in transformMFiles', () => {
            const message = {
                files: [{ file: { id: 'test' } }],
            } as any;

            service.transformMFiles(message);
            expect(mockTransformFiles).toHaveBeenCalled();
        });

        it('should call transformFiles multiple times in transformMessage', () => {
            const message = {
                files: [{ file: { id: 'file1' } }],
                sentBy: {
                    avatar: {
                        file: { id: 'avatar1' },
                    },
                },
                replyToMessage: {
                    files: [{ file: { id: 'file2' } }],
                },
            } as any;

            mockTransformFiles.mockReset();
            service.transformMessage(message);
            expect(mockTransformFiles).toHaveBeenCalledTimes(3);
        });
    });
});
