import { Column } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

export abstract class BaseRepairsEntity<T> extends AbstractEntity<T> {
    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    roof: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    landscaping: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    concierge: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    garage: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    bathrooms: number;
}
