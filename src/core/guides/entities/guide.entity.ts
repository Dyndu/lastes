import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { GuideStatusEnum } from '../../../common/enum';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { UserGuideLikeEntity } from './user-guide-like.entity';

@Entity('guides')
export class GuideEntity extends AbstractEntity<GuideEntity> {
    @Column({ nullable: false })
    label: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ nullable: true, type: 'text' })
    content?: string;

    @Column({ nullable: false, type: 'boolean', default: false })
    isVideo: boolean;

    @Column({ type: 'enum', enum: GuideStatusEnum, nullable: false })
    status: GuideStatusEnum;

    @ManyToOne(() => CategoryEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'categoryId' })
    category: CategoryEntity;

    @ManyToOne(() => FileLinksEntity, { eager: false })
    @JoinColumn({ name: 'fileId' })
    file: FileLinksEntity;

    @OneToMany(() => UserGuideLikeEntity, (l) => l.guide, {
        eager: false,
    })
    likes: UserGuideLikeEntity[];
}
