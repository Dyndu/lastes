import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { GuideEntity } from './guide.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { GuideReactionEnum } from '../../../common/enum';

@Entity('user_guide_likes')
export class UserGuideLikeEntity extends AbstractEntity<UserGuideLikeEntity> {
    @ManyToOne(() => GuideEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'guideId' })
    guide: GuideEntity;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ type: 'enum', enum: GuideReactionEnum, nullable: true })
    reaction?: GuideReactionEnum;
}
