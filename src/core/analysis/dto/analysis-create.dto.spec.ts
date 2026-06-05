import { validate } from 'class-validator';
import { AnalysisCreateDto } from './analysis-create.dto';

const VALID_UUID = '3fb7cde0-35d2-43b7-8172-87ddae7fda60';
const VALID_MODULE_UUID = '7f3f5860-a780-41a0-8484-4990a811ddd9';

function buildDto(overrides: Partial<AnalysisCreateDto> = {}): AnalysisCreateDto {
    const dto = new AnalysisCreateDto();
    dto.propertyId = VALID_UUID;
    dto.moduleId = VALID_MODULE_UUID;
    Object.assign(dto, overrides);
    return dto;
}

async function getErrorsFor(dto: AnalysisCreateDto, property: string): Promise<string[]> {
    const errors = await validate(dto);
    const found = errors.find((e) => e.property === property);
    return found ? Object.values(found.constraints ?? {}) : [];
}

describe('AnalysisCreateDto', () => {
    describe('valid dto', () => {
        it('should pass validation with all required fields', async () => {
            const errors = await validate(buildDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with optional description provided', async () => {
            const errors = await validate(
                buildDto({ description: 'Analysis on my house at New York' }),
            );
            expect(errors).toHaveLength(0);
        });

        it('should pass validation when description is omitted', async () => {
            const dto = buildDto();
            delete dto.description;
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('propertyId', () => {
        it('should fail when propertyId is missing', async () => {
            const dto = buildDto();
            delete (dto as any).propertyId;
            const messages = await getErrorsFor(dto, 'propertyId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when propertyId is empty string', async () => {
            const messages = await getErrorsFor(buildDto({ propertyId: '' }), 'propertyId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when propertyId is not a valid UUID v4', async () => {
            const messages = await getErrorsFor(
                buildDto({ propertyId: 'not-a-uuid' }),
                'propertyId',
            );
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when propertyId is a UUID v3 (not v4)', async () => {
            const messages = await getErrorsFor(
                buildDto({ propertyId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
                'propertyId',
            );
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when propertyId has less than 2 characters', async () => {
            const messages = await getErrorsFor(buildDto({ propertyId: 'a' }), 'propertyId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when propertyId is not a string', async () => {
            const messages = await getErrorsFor(buildDto({ propertyId: 123 as any }), 'propertyId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should pass with a valid UUID v4', async () => {
            const messages = await getErrorsFor(buildDto({ propertyId: VALID_UUID }), 'propertyId');
            expect(messages).toHaveLength(0);
        });
    });

    describe('moduleId', () => {
        it('should fail when moduleId is missing', async () => {
            const dto = buildDto();
            delete (dto as any).moduleId;
            const messages = await getErrorsFor(dto, 'moduleId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when moduleId is empty string', async () => {
            const messages = await getErrorsFor(buildDto({ moduleId: '' }), 'moduleId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when moduleId is not a valid UUID v4', async () => {
            const messages = await getErrorsFor(buildDto({ moduleId: 'not-a-uuid' }), 'moduleId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when moduleId is a UUID v3 (not v4)', async () => {
            const messages = await getErrorsFor(
                buildDto({ moduleId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
                'moduleId',
            );
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when moduleId has less than 2 characters', async () => {
            const messages = await getErrorsFor(buildDto({ moduleId: 'a' }), 'moduleId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when moduleId is not a string', async () => {
            const messages = await getErrorsFor(buildDto({ moduleId: 123 as any }), 'moduleId');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should pass with a valid UUID v4', async () => {
            const messages = await getErrorsFor(
                buildDto({ moduleId: VALID_MODULE_UUID }),
                'moduleId',
            );
            expect(messages).toHaveLength(0);
        });
    });

    describe('description', () => {
        it('should pass when description is a valid string', async () => {
            const messages = await getErrorsFor(
                buildDto({ description: 'Analysis on my house at New York' }),
                'description',
            );
            expect(messages).toHaveLength(0);
        });

        it('should pass when description is undefined (optional field)', async () => {
            const dto = buildDto();
            delete dto.description;
            const messages = await getErrorsFor(dto, 'description');
            expect(messages).toHaveLength(0);
        });

        it('should fail when description is provided but shorter than 2 characters', async () => {
            const messages = await getErrorsFor(buildDto({ description: 'a' }), 'description');
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should fail when description is not a string', async () => {
            const messages = await getErrorsFor(
                buildDto({ description: 123 as any }),
                'description',
            );
            expect(messages.length).toBeGreaterThan(0);
        });

        it('should pass when description is exactly 2 characters (min boundary)', async () => {
            const messages = await getErrorsFor(buildDto({ description: 'ab' }), 'description');
            expect(messages).toHaveLength(0);
        });
    });
});
