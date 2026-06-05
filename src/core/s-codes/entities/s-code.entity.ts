import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('support_code')
export class SCodeEntity extends AbstractEntity<SCodeEntity> {
    @Column({ nullable: false })
    label: string;
}
