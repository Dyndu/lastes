import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { EncryptionTransformer } from '../../../helpers/encryption/encryption.transformer';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('')
export class MExportEntity extends AbstractEntity<MExportEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @Column({ nullable: false, type: 'text' })
    companyName: string;

    @Column({ nullable: false, type: 'text', transformer: EncryptionTransformer })
    phoneNumber: string;

    @Column({ nullable: false, type: 'text', transformer: EncryptionTransformer })
    address: string;

    @Column({ nullable: false, type: 'text', transformer: EncryptionTransformer })
    email: string;

    @ManyToOne(() => UserEntity, { eager: false })
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;

    @ManyToOne(() => FileLinksEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'fileId' })
    file: FileLinksEntity;
}
