import { ValueTransformer } from 'typeorm';

export const decimalTransformer: ValueTransformer = {
    to: (value: number): string => value?.toString(),
    from: (value: string): number => Number.parseFloat(value),
};
