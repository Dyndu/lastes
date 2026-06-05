import { FileStorageInterface } from './file-storage.interface';

describe('FileStorageInterface implementation', () => {
    class MockFileStorage implements FileStorageInterface {
        uploadFile = jest.fn().mockResolvedValue('https://fakeurl.com/file.jpg');
        deleteFile = jest.fn().mockResolvedValue({ deleted: true });
    }

    let storage: FileStorageInterface;

    beforeEach(() => {
        storage = new MockFileStorage();
    });

    it('should upload a file and return a URL', async () => {
        const file = {
            originalname: 'test.png',
            buffer: Buffer.from(''),
            mimetype: 'image/png',
            size: 123,
        } as unknown as Express.Multer.File;

        const result = await storage.uploadFile(file, '1234');
        expect(result).toBe('https://fakeurl.com/file.jpg');
        expect((storage.uploadFile as jest.Mock).mock.calls[0][1]).toBe('1234');
    });

    it('should delete a file and return result', async () => {
        const result = await storage.deleteFile('1234');
        expect(result).toEqual({ deleted: true });
        expect((storage.deleteFile as jest.Mock).mock.calls[0][0]).toBe('1234');
    });
});
