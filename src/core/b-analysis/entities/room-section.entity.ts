import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { RoomCategoryEntity } from './room-category.entity';
import { RoomExpenseItemEntity } from './room-expense-item.entity';

@Entity('rooms')
export class RoomSectionEntity extends AbstractEntity<RoomSectionEntity> {
    @Column({ nullable: false })
    label: string;

    @ManyToOne(() => RoomCategoryEntity, (section) => section.sections, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'roomCategoryId' })
    roomCategory?: RoomCategoryEntity;

    @OneToMany(() => RoomExpenseItemEntity, (expense) => expense.roomSection)
    expenses: RoomExpenseItemEntity[];
}
