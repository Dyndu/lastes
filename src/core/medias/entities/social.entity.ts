import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('social_networks')
export class SocialEntity extends AbstractEntity<SocialEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @Column({ nullable: false, type: 'boolean', default: true })
    isActive: boolean;
}
