import { ValidationArguments } from 'class-validator';
import {
    handleUpdate,
    handleCreate,
    isUniqueRelation,
    IsMRelationUnique,
} from './is-mrelation-unique.decorator';
import { MRelationDto } from './m-relation.dto';
import { ModuleMethodEnum } from '../../../common/enum';

describe('MRelation Unique Decorator', () => {
    describe('handleUpdate', () => {
        it('should return true when item has no id', () => {
            const item = { method: ModuleMethodEnum.UPDATE } as MRelationDto;
            const seen = new Set<string>();

            expect(handleUpdate(item, seen)).toBe(true);
        });

        it('should return false when id is already seen', () => {
            const item = {
                id: '1',
                method: ModuleMethodEnum.UPDATE,
            } as MRelationDto;
            const seen = new Set<string>(['1']);

            expect(handleUpdate(item, seen)).toBe(false);
        });

        it('should return true and add id to seen set when id is new', () => {
            const item = {
                id: '1',
                method: ModuleMethodEnum.UPDATE,
            } as MRelationDto;
            const seen = new Set<string>();

            expect(handleUpdate(item, seen)).toBe(true);
            expect(seen.has('1')).toBe(true);
        });
    });

    describe('handleCreate', () => {
        it('should return true when item has no label', () => {
            const item = { method: ModuleMethodEnum.CREATE } as MRelationDto;
            const seen = new Set<string>();

            expect(handleCreate(item, seen)).toBe(true);
        });

        it('should return false when label is already seen (case-insensitive)', () => {
            const item = {
                label: 'Test Label',
                method: ModuleMethodEnum.CREATE,
            } as MRelationDto;
            const seen = new Set<string>(['test label']);

            expect(handleCreate(item, seen)).toBe(false);
        });

        it('should return true and add normalized label to seen set when label is new', () => {
            const item = {
                label: '  Test Label  ',
                method: ModuleMethodEnum.CREATE,
            } as MRelationDto;
            const seen = new Set<string>();

            expect(handleCreate(item, seen)).toBe(true);
            expect(seen.has('test label')).toBe(true);
        });

        it('should handle labels with different casing and whitespace', () => {
            const item1 = {
                label: 'MyLabel',
                method: ModuleMethodEnum.CREATE,
            } as MRelationDto;
            const item2 = {
                label: '  mylabel  ',
                method: ModuleMethodEnum.CREATE,
            } as MRelationDto;
            const seen = new Set<string>();

            expect(handleCreate(item1, seen)).toBe(true);
            expect(handleCreate(item2, seen)).toBe(false);
        });
    });

    describe('isUniqueRelation', () => {
        it('should call handleUpdate when method is UPDATE', () => {
            const item = {
                id: '1',
                method: ModuleMethodEnum.UPDATE,
            } as MRelationDto;
            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            expect(isUniqueRelation(item, seenUpdate, seenCreate)).toBe(true);
            expect(seenUpdate.has('1')).toBe(true);
        });

        it('should call handleCreate when method is CREATE', () => {
            const item = {
                label: 'Test',
                method: ModuleMethodEnum.CREATE,
            } as MRelationDto;
            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            expect(isUniqueRelation(item, seenUpdate, seenCreate)).toBe(true);
            expect(seenCreate.has('test')).toBe(true);
        });

        it('should return true when method is neither UPDATE nor CREATE', () => {
            const item = { method: 'OTHER' as any } as MRelationDto;
            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            expect(isUniqueRelation(item, seenUpdate, seenCreate)).toBe(true);
        });
    });

    describe('IsMRelationUnique decorator', () => {
        class TestDto {
            @IsMRelationUnique({ message: 'Custom error message' })
            relations: MRelationDto[];
        }

        beforeEach(() => {
            const testDto = new TestDto();
            const decoratorFactory = IsMRelationUnique();
            decoratorFactory(testDto, 'relations');
        });

        it('should validate empty array as true', () => {
            const value: MRelationDto[] = [];
            expect(value.every(() => true)).toBe(true);
        });

        it('should detect duplicate UPDATE ids', () => {
            const value: MRelationDto[] = [
                { id: '1', method: ModuleMethodEnum.UPDATE } as MRelationDto,
                { id: '1', method: ModuleMethodEnum.UPDATE } as MRelationDto,
            ];

            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            const result = value.every((item) => isUniqueRelation(item, seenUpdate, seenCreate));

            expect(result).toBe(false);
        });

        it('should detect duplicate CREATE labels', () => {
            const value: MRelationDto[] = [
                {
                    label: 'Label1',
                    method: ModuleMethodEnum.CREATE,
                } as MRelationDto,
                {
                    label: 'label1',
                    method: ModuleMethodEnum.CREATE,
                } as MRelationDto,
            ];

            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            const result = value.every((item) => isUniqueRelation(item, seenUpdate, seenCreate));

            expect(result).toBe(false);
        });

        it('should allow unique relations', () => {
            const value: MRelationDto[] = [
                { id: '1', method: ModuleMethodEnum.UPDATE } as MRelationDto,
                { id: '2', method: ModuleMethodEnum.UPDATE } as MRelationDto,
                {
                    label: 'Label1',
                    method: ModuleMethodEnum.CREATE,
                } as MRelationDto,
                {
                    label: 'Label2',
                    method: ModuleMethodEnum.CREATE,
                } as MRelationDto,
            ];

            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            const result = value.every((item) => isUniqueRelation(item, seenUpdate, seenCreate));

            expect(result).toBe(true);
        });

        it('should return proper default error message', () => {
            const args = {
                property: 'relations',
            } as ValidationArguments;

            const expectedMessage = `${args.property} contains duplicate relations`;
            expect(expectedMessage).toBe('relations contains duplicate relations');
        });
    });

    describe('Integration test with class-validator', () => {
        it('should validate mixed valid and invalid relations', () => {
            const value: MRelationDto[] = [
                { id: '1', method: ModuleMethodEnum.UPDATE } as MRelationDto,
                {
                    label: 'New1',
                    method: ModuleMethodEnum.CREATE,
                } as MRelationDto,
                { id: '2', method: ModuleMethodEnum.UPDATE } as MRelationDto,
                {
                    label: 'New2',
                    method: ModuleMethodEnum.CREATE,
                } as MRelationDto,
                { method: 'DELETE' as any } as MRelationDto,
            ];

            const seenUpdate = new Set<string>();
            const seenCreate = new Set<string>();

            const result = value.every((item) => isUniqueRelation(item, seenUpdate, seenCreate));

            expect(result).toBe(true);
        });
    });
});
