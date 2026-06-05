import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('footer_information')
export class FooterInfoEntity extends AbstractEntity<FooterInfoEntity> {
    @Column({ nullable: false, type: 'text' })
    phoneNumber: string;

    @Column({ nullable: false, type: 'text' })
    email: string;

    @Column({ nullable: true, type: 'text' })
    facebook?: string;

    @Column({ nullable: true, type: 'text' })
    instagram?: string;

    @Column({ nullable: true, type: 'text' })
    linkedIn?: string;

    @Column({ nullable: true, type: 'text' })
    twitter?: string;

    @Column({ nullable: true, type: 'text' })
    discord?: string;
}
