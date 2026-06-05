import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('category')
export class CategoryEntity extends AbstractEntity<CategoryEntity> {
    @Column({ nullable: false })
    label: string;
}
