import { Test, TestingModule } from '@nestjs/testing';
import { AwsService } from './aws.service';

describe('AwsModule', () => {
    let module: TestingModule;
    let awsFile: AwsService;

    beforeEach(async () => {
        const mockAwsFile = {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFile: jest.fn(),
            listFiles: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                {
                    provide: AwsService,
                    useValue: mockAwsFile,
                },
            ],
        }).compile();

        awsFile = module.get<AwsService>(AwsService);
    });

    it('should be defined', () => {
        expect(awsFile).toBeDefined();
    });

    it('should have AwsService service', () => {
        expect(awsFile).toBeInstanceOf(Object);
    });

    it('should export AwsService service', () => {
        const exportedService = module.get<AwsService>(AwsService);
        expect(exportedService).toBe(awsFile);
    });
});
