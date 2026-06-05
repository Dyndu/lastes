import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { UpdateREItemDto } from '../../core/b-analysis/dto';

export function handleUpdateItem(item: UpdateREItemDto, seenIds: Set<string>): boolean {
    if (!item.id) return true;
    if (seenIds.has(item.id)) return false;

    seenIds.add(item.id);
    return true;
}

export function handleCreateItem(item: UpdateREItemDto, seenLabels: Set<string>): boolean {
    if (!item.label) return true;

    const key = item.label.toLowerCase().trim();
    if (seenLabels.has(key)) return false;

    seenLabels.add(key);
    return true;
}

export function isUniqueREItem(
    item: UpdateREItemDto,
    seenIds: Set<string>,
    seenLabels: Set<string>,
): boolean {
    if (item.id) return handleUpdateItem(item, seenIds);
    return handleCreateItem(item, seenLabels);
}

export function IsREItemUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isREItemUnique',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: UpdateREItemDto[], _args: ValidationArguments) {
                    if (!Array.isArray(value)) return true;

                    const seenIds = new Set<string>();
                    const seenLabels = new Set<string>();

                    return value.every((item) => isUniqueREItem(item, seenIds, seenLabels));
                },

                defaultMessage(args: ValidationArguments) {
                    return `${args.property} contains duplicate expense items`;
                },
            },
        });
    };
}
