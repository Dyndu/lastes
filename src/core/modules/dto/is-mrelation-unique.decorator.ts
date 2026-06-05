import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { MRelationDto } from './m-relation.dto';
import { ModuleMethodEnum } from '../../../common/enum';

export function handleUpdate(item: MRelationDto, seen: Set<string>): boolean {
    if (!item.id) return true;
    if (seen.has(item.id)) return false;

    seen.add(item.id);
    return true;
}

export function handleCreate(item: MRelationDto, seen: Set<string>): boolean {
    if (!item.label) return true;

    const key = item.label.toLowerCase().trim();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
}

export function isUniqueRelation(
    item: MRelationDto,
    seenUpdate: Set<string>,
    seenCreate: Set<string>,
): boolean {
    if (item.method === ModuleMethodEnum.UPDATE) return handleUpdate(item, seenUpdate);
    if (item.method === ModuleMethodEnum.CREATE) return handleCreate(item, seenCreate);

    return true;
}

export function IsMRelationUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isMRelationUnique',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: MRelationDto[], _args: ValidationArguments) {
                    if (!Array.isArray(value)) return true;

                    const seenUpdate = new Set<string>();
                    const seenCreate = new Set<string>();

                    return value.every((item) => isUniqueRelation(item, seenUpdate, seenCreate));
                },

                defaultMessage(args: ValidationArguments) {
                    return `${args.property} contains duplicate relations`;
                },
            },
        });
    };
}
