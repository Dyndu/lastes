import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { BAnalysisTypeEnum } from '../../../common/enum';
import { BAnalysisEntity } from './b-analysis.entity';
import { RoomSectionEntity } from './room-section.entity';

@Entity('room_category')
export class RoomCategoryEntity extends AbstractEntity<RoomCategoryEntity> {
    @Column({ nullable: false })
    label: string;

    @Column({ type: 'enum', enum: BAnalysisTypeEnum, nullable: false })
    type: BAnalysisTypeEnum;

    @ManyToOne(() => BAnalysisEntity, (analysis) => analysis.rooms, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'bAnalysisId' })
    bAnalysis?: BAnalysisEntity;

    @OneToMany(() => RoomSectionEntity, (expense) => expense.roomCategory)
    sections: RoomSectionEntity[];
}
