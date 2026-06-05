import { Injectable } from '@nestjs/common';
import { RoomCategoryEntity, RoomExpenseItemEntity, RoomSectionEntity } from '../entities';

@Injectable()
export class TransformBAEntitiesService {
    /**
     * Service responsible for transforming rehab calculator data to ui view
     */

    /**
     * Transforms a RoomExpenseItemEntity into a simplified DTO object.
     * Extracts and returns only the essential fields: id, label, calculation method, labor value, material value and total.
     */
    transformREItem = (item: RoomExpenseItemEntity) => ({
        id: item.id,
        label: item.label,
        cMethod: item.cMethod,
        laborValue: item.laborValue,
        materialValue: item.materialValue,
        total: item.total,
    });

    /**
     * Transforms an array of RoomExpenseItemEntity into an array of simplified DTO objects.
     * Applies the transformREItem function to each entity in the input array.
     */
    transformREItems = (items: RoomExpenseItemEntity[]) =>
        items.map((item: RoomExpenseItemEntity) => this.transformREItem(item));

    /**
     * Transforms a RoomSectionEntity into a simplified DTO object.
     * Extracts and returns only the essential fields: id and label.
     */
    transformRoomSection = (item: RoomSectionEntity) => ({
        id: item.id,
        label: item.label,
    });

    /**
     * Transforms an array of RoomSectionEntity into an array of simplified DTO objects.
     * Applies the transformRoomSection function to each entity in the input array.
     */
    transformRoomSections = (items: RoomSectionEntity[]) =>
        items.map((item: RoomSectionEntity) => this.transformRoomSection(item));

    /**
     * Transforms a RoomSectionEntity into a detailed DTO object, including its associated expenses.
     * Extends the basic room section transformation by adding an array of transformed expense items,
     * or an empty array if no expenses are present.
     */
    transformRSection = (item: RoomSectionEntity) => ({
        ...this.transformRoomSection(item),
        expenses: item.expenses?.length > 0 ? this.transformREItems(item.expenses) : [],
    });

    /**
     * Transforms a RoomCategoryEntity into a simplified DTO object.
     * Extracts and returns only the essential fields: id, label, and type.
     */
    transformRoom = (item: RoomCategoryEntity) => ({
        id: item.id,
        label: item.label,
        type: item.type,
    });

    /**
     * Transforms an array of RoomCategoryEntity into an array of simplified DTO objects.
     * Applies the transformRoom function to each entity in the input array.
     */
    transformRooms = (items: RoomCategoryEntity[]) =>
        items.map((item: RoomCategoryEntity) => this.transformRoom(item));

    /**
     * Transforms a RoomCategoryEntity into a detailed DTO object, including its associated sections.
     * Extracts the id, label, and type, and transforms the sections array if present.
     */
    transformRCategory = (item: RoomCategoryEntity) => ({
        ...this.transformRoom(item),
        sections: item.sections?.length > 0 ? this.transformRoomSections(item.sections) : [],
    });

    /**
     * Transforms an array of RoomCategoryEntity into an array of detailed DTO objects.
     * Applies the transformRCategory function to each entity in the input array.
     */
    transformRCategories = (items: RoomCategoryEntity[]) =>
        items.map((item) => this.transformRCategory(item));
}
