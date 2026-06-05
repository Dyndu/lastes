import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UnitEntity, PDetailsEntity } from '../entities';
import { UnitsDto } from '../dto';
import { ABuilderService } from './a-builder.service';

@Injectable()
export class UnitsService {
    /**
     * Service responsible for handling property details units operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Constructs a new UnitEntity using the required fields (sqFootage, bedRooms, bathRooms, monthlyRent, pDetails).
     * Returns the initialized unit entities.
     */
    buildUnitEntity(required: {
        sqFootage: number;
        bedRooms: number;
        bathRooms: number;
        monthlyRent: number;
        pDetails: PDetailsEntity;
    }) {
        const unit = new UnitEntity();
        Object.assign(unit, required);
        return unit;
    }

    /**
     * Creates multiple UnitEntity objects from an array of UnitsDto and associates them with a PDetailsEntity.
     * Only proceeds if the items array is not empty.
     */
    async createPDetailsUnits(pDetails: PDetailsEntity, items: UnitsDto[]) {
        if (!items.length) return;

        await this.aBuilderService.unitRepository.createMany(
            items.map((item) =>
                this.buildUnitEntity({
                    sqFootage: item.sqFootage,
                    bathRooms: item.bathRooms,
                    bedRooms: item.bedRooms,
                    monthlyRent: item.monthlyRent,
                    pDetails,
                }),
            ),
        );
    }

    /**
     * Asynchronously deletes all units associated with a specific property details entities (PDetailsEntity).
     * Uses the provided `pDetails.id` to target and remove related units from the database.
     */
    async deletePDetailsUnits(pDetails: PDetailsEntity) {
        await this.aBuilderService.unitRepository.delete({
            pDetails: { id: pDetails.id },
        });
    }
}
