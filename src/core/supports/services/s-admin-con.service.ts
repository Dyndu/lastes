import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { SAdminConEntity, SConEntity, SMessagesEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class SAdminConService {
    /**
     * Service responsible for handling admin unread count support messages
     */

    constructor(
        @Inject(forwardRef(() => SupportsService))
        private readonly supportsService: SupportsService,
    ) {}

    /**
     * Constructs and returns a new SAdminConEntity instance using required and optional fields.
     * Required fields include the admin (UserEntity) and conversation (SConEntity).
     * Optional fields include the last read message.
     */
    buildSAdminConEntity(
        required: {
            admin: UserEntity;
            conversation: SConEntity;
        },
        optional: {
            lastReadMessage?: SMessagesEntity;
        },
    ): SAdminConEntity {
        const data = new SAdminConEntity();
        Object.assign(data, required, optional);
        return data;
    }

    /**
     * Associates an admin with a support conversation, creating a new admin-conversation link if it doesn't already exist.
     * Returns the existing or newly created admin-conversation entities.
     */
    async associateAdminCon(
        admin: UserEntity,
        con: SConEntity,
        lastReadMessage?: SMessagesEntity,
    ): Promise<SAdminConEntity> {
        const isAdminConExist = await this.supportsService.sAdminConRepo.findOne({
            where: {
                admin: { id: admin.id },
                conversation: { id: con.id },
                deleted: false,
            },
            relations: this.supportsService.sTransformService.adminConEntities(),
        });

        if (isAdminConExist) return isAdminConExist;
        return await this.supportsService.sAdminConRepo.create(
            this.buildSAdminConEntity({ admin, conversation: con }, { lastReadMessage }),
        );
    }
}
