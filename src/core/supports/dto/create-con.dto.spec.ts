import { validate } from 'class-validator';
import { CreateConDto } from './create-con.dto';

describe('CreateConDto', () => {
    let dto: CreateConDto;

    beforeEach(() => {
        dto = new CreateConDto();
        dto.codeId = '7f3f5860-a780-41a0-8484-4990a811ddd9';
        dto.content = 'Hello, this is a support message';
        dto.files = ['7f3f5860-a780-41a0-8484-4990a811ddd8'];
    });

    it('should validate a correct DTO', async () => {
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    describe('codeId validation', () => {
        it('should fail if codeId is missing (Required branch)', async () => {
            delete (dto as any).codeId;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail if codeId is not a string', async () => {
            (dto as any).codeId = 12345;
            const errors = await validate(dto);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('content validation', () => {
        it('should fail if content is too short (MinLength branch)', async () => {
            dto.content = 'a';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });
    });

    describe('files validation', () => {
        it('should pass if files is missing (IsOptional branch)', async () => {
            delete dto.files;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail if files is not an array', async () => {
            (dto as any).files = 'not-an-array';
            const errors = await validate(dto);
            expect(errors[0].constraints).toHaveProperty('isArray');
        });

        it('should fail if files contain duplicates (ArrayUnique branch)', async () => {
            const id = '7f3f5860-a780-41a0-8484-4990a811ddd9';
            dto.files = [id, id];
            const errors = await validate(dto);
            expect(errors[0].constraints).toHaveProperty('arrayUnique');
        });

        it('should fail if elements are not valid UUIDs (IsUUID branch)', async () => {
            dto.files = ['invalid-uuid'];
            const errors = await validate(dto);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });
    });
});
