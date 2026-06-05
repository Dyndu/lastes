import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AdsFormatEnum, AdsStatusEnum, AdsTypeEnum } from '../../../common/enum';
import { FileLinksEntity } from '../../files/entities/file-links.entity';

@Entity('ads_entry')
export class AdsEntity extends AbstractEntity<AdsEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @Column({ nullable: false, type: 'text' })
    companyName: string;

    @Column({ type: 'date', nullable: false })
    startDate: Date;

    @Column({ type: 'date', nullable: false })
    endDate: Date;

    @Column({ type: 'boolean', nullable: false, default: true })
    isActive: boolean;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: {
            to: (value: number): string => value?.toString(),
            from: (value: string): number => Number.parseFloat(value),
        },
    })
    amount: number;

    @Column({
        type: 'enum',
        nullable: false,
        default: AdsTypeEnum.STANDARD,
        enum: AdsTypeEnum,
    })
    type: AdsTypeEnum;

    @Column({
        type: 'enum',
        nullable: false,
        default: AdsStatusEnum.SCHEDULED,
        enum: AdsStatusEnum,
    })
    status: AdsStatusEnum;

    @Column({
        type: 'enum',
        nullable: false,
        default: AdsFormatEnum.HORIZONTAL,
        enum: AdsFormatEnum,
    })
    format: AdsFormatEnum;

    @ManyToOne(() => FileLinksEntity, { eager: false })
    @JoinColumn({ name: 'fileId' })
    file: FileLinksEntity;
}
