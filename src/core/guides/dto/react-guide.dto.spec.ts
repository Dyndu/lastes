import { IsArray, IsEnum, validate } from 'class-validator';
import { ReactGuideDto } from './react-guide.dto';
import { GuideReactionEnum } from '../../../common/enum';

class ArrayDto {
    @IsArray({ message: 'reaction must be an array' })
    @IsEnum(GuideReactionEnum, {
        each: true,
        message: 'reaction must contain valid enum values',
    })
    reaction?: GuideReactionEnum[];
}

describe('ReactGuideDto', () => {
    let dto: ReactGuideDto;

    beforeEach(() => {
        dto = new ReactGuideDto();
    });

    describe('reaction field', () => {
        it('should pass validation with LIKE', async () => {
            dto.reaction = GuideReactionEnum.LIKE;
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with DISLIKE', async () => {
            dto.reaction = GuideReactionEnum.DISLIKE;
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with undefined (optional)', async () => {
            dto.reaction = undefined;
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation with invalid enum value', async () => {
            dto.reaction = 'INVALID' as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('reaction');
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });

        it('should fail validation with number', async () => {
            dto.reaction = 123 as any;
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('reaction');
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Array behavior', () => {
        it('should validate array of valid enum values', async () => {
            const dto = new ArrayDto();
            dto.reaction = [GuideReactionEnum.LIKE, GuideReactionEnum.DISLIKE];
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail array validation with invalid enum in array', async () => {
            const dto = new ArrayDto();
            dto.reaction = [GuideReactionEnum.LIKE, 'INVALID' as any];
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('reaction');
            expect(errors[0].constraints).toHaveProperty('isEnum');
        });
    });
});
