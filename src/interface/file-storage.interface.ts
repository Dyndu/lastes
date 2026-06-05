export interface FileStorageInterface {
    uploadFile(file: Express.Multer.File, key: string): Promise<string>;
    deleteFile(key: string): Promise<object>;
}
