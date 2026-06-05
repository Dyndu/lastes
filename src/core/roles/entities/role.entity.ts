import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('roles')
export class RoleEntity extends AbstractEntity<RoleEntity> {
    @Column({ nullable: false })
    label: string;
}
