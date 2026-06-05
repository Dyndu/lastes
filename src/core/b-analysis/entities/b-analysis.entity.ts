import { Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { RCalculatorEntity } from '../../r-calculator/entity/r-calculator.entity';
import { RoomCategoryEntity } from './room-category.entity';

@Entity('b_analysis')
export class BAnalysisEntity extends AbstractEntity<BAnalysisEntity> {
    @OneToOne(() => RCalculatorEntity, (rental) => rental.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'rCalculatorId' })
    rCalculator?: RCalculatorEntity;

    @OneToMany(() => RoomCategoryEntity, (room) => room.bAnalysis)
    rooms: RoomCategoryEntity[];
}
