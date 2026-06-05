import { Column } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

export abstract class BaseRefiEntity<T> extends AbstractEntity<T> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    afterRepairValue: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    refiLTV: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    newLoanAmount: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    interestRate: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    pmi: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    point: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    pInterest: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    oldLoanAmount: number;

    @Column({
        nullable: false,
        type: 'decimal',
        default: 0,
        transformer: decimalTransformer,
    })
    hoa: number;
}
