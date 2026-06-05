import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CalculationMethodEnum } from '../../../common/enum';
import { decimalTransformer } from '../../../utils/services/transformers';
import { RoomSectionEntity } from './room-section.entity';

@Entity('room_expense_item')
export class RoomExpenseItemEntity extends AbstractEntity<RoomExpenseItemEntity> {
    @Column({ nullable: false })
    label: string;

    @Column({ type: 'enum', enum: CalculationMethodEnum, nullable: false })
    cMethod: CalculationMethodEnum;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    laborValue: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    materialValue: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    total: number;

    @ManyToOne(() => RoomSectionEntity, (section) => section.expenses, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'roomSectionId' })
    roomSection: RoomSectionEntity;
}
