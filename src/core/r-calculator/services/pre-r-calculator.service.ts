import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RCalculatorService } from './r-calculator.service';
import { RCalculatorEntity } from '../entity/r-calculator.entity';
import { AnalysisEntity } from '../../analysis/entities';
import { BAnalysisTypeEnum } from '../../../common/enum';
import {
    BAnalysisEntity,
    RoomCategoryEntity,
    RoomExpenseItemEntity,
    RoomSectionEntity,
} from '../../b-analysis/entities';

type ExpenseDto = {
    id: string;
    label: string;
    labor: number;
    material: number;
    total: number;
};

type SectionDto = {
    id: string;
    label: string;
    expenses: ExpenseDto[];
    total: number;
};

type CategoryDto = {
    id: string;
    label: string;
    type: BAnalysisTypeEnum;
    sections: SectionDto[];
    total: number;
};

type SummaryDto = {
    totalProjectCost: number;
    categories: CategoryDto[];
};

@Injectable()
export class PreRCalculatorService {
    /**
     * Service responsible for handling pre rehab calculator operation
     */

    constructor(
        @Inject(forwardRef(() => RCalculatorService))
        readonly rCalculatorService: RCalculatorService,
    ) {}

    /**
     * Computes the total for a room expense item row.
     * Delegates the calculation to the room expense item service using the provided DTO values,
     * including calculation method, labor value, material value, and optional manual total.
     */
    computeREItemRowTotal(item: RoomExpenseItemEntity) {
        return this.rCalculatorService.bAnalysisService.roomExpenseItemService.resolveTotal(
            item.cMethod,
            item.laborValue,
            item.materialValue,
            item.total,
        );
    }

    /**
     * Computes the total for a room expense section by summing the totals of all its items.
     * Iterates over each item in the provided DTO, calculates the total for each item,
     * and accumulates the results to return the section's overall total.
     */
    computeRSectionTotal(section: RoomSectionEntity) {
        return section.expenses.reduce((sum, item) => {
            const itemTotal = this.computeREItemRowTotal(item);
            return sum + (itemTotal ?? 0);
        }, 0);
    }

    /**
     * Computes the total for a room category by summing the totals of all its sections and expenses.
     * Iterates over each section in the room, then over each expense in the section,
     * accumulates the expense totals to get the section total, and sums all section totals
     * to return the room's overall total.
     */
    computeRoomTotal(room: RoomCategoryEntity): number {
        return room.sections.reduce((roomSum, section) => {
            const sectionTotal = section.expenses.reduce((sectionSum, expense) => {
                const expenseTotal = expense.total;
                return sectionSum + expenseTotal;
            }, 0);
            return roomSum + sectionTotal;
        }, 0);
    }

    /**
     * Constructs and returns a new RCalculatorEntity from the provided required fields.
     * Assigns the associated analysis entity to a new RCalculatorEntity instance.
     */
    buildRCalculator(required: { analysis: AnalysisEntity }) {
        const result = new RCalculatorEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Initializes the rental calculator for a given analysis.
     * Retrieves an existing calculator if available or creates a new one, then initializes the associated B analysis.
     * Returns the fully loaded B analysis entity using the specified relations.
     */
    async initializeRCalculatorForAnalysis(analysis: AnalysisEntity, relations: string[]) {
        const existing = await this.rCalculatorService.rCalculatorRepo.findOne({
            where: { analysis: { id: analysis.id } },
        });

        const rCalculator =
            existing ??
            (await this.rCalculatorService.rCalculatorRepo.create(
                this.buildRCalculator({ analysis }),
            ));

        const data = await this.rCalculatorService.bAnalysisService.createBAnalysis(rCalculator);

        return await this.rCalculatorService.bAnalysisService.retrieveBAnalysisByCriteria(
            { id: data.id },
            relations,
        );
    }

    /**
     * Maps a room expense entity to an expense DTO.
     * Extracts and normalizes expense values, ensuring numeric fields for labor,
     * material, and total amounts in the resulting object.
     */
    mapExpense(expense: RoomExpenseItemEntity): ExpenseDto {
        const total = Number(expense.total) || 0;

        return {
            id: expense.id,
            label: expense.label,
            labor: Number(expense.laborValue) || 0,
            material: Number(expense.materialValue) || 0,
            total,
        };
    }

    /**
     * Maps a room section entity to a section DTO.
     * Transforms associated expenses, aggregates their totals,
     * and returns the section data with computed total value.
     */
    mapSection(section: RoomSectionEntity): SectionDto {
        let sectionTotal = 0;

        const expenses = (section.expenses ?? []).map((expense) => {
            const dto = this.mapExpense(expense);
            sectionTotal += dto.total;
            return dto;
        });

        return {
            id: section.id,
            label: section.label,
            expenses,
            total: sectionTotal,
        };
    }

    /**
     * Maps a room category entity to a category DTO.
     * Transforms associated sections, aggregates their totals,
     * and returns the category data with computed total value.
     */
    mapCategory(room: RoomCategoryEntity): CategoryDto {
        let categoryTotal = 0;

        const sections = (room.sections ?? []).map((section) => {
            const dto = this.mapSection(section);
            categoryTotal += dto.total;
            return dto;
        });

        return {
            id: room.id,
            label: room.label,
            type: room.type,
            sections,
            total: categoryTotal,
        };
    }

    /**
     * Generates the rehab calculator summary from the analysis builder.
     * Maps room categories, aggregates their totals, and computes the overall
     * project cost along with the categorized breakdown.
     */
    rCalculatorSummary(aBuilder: BAnalysisEntity): SummaryDto {
        const categories = (aBuilder.rooms ?? []).map((room) => this.mapCategory(room));

        const totalProjectCost = categories.reduce((sum, cat) => sum + cat.total, 0);

        return {
            totalProjectCost,
            categories,
        };
    }

    /**
     * Maps a room category entity to a punch list room DTO.
     * Flattens all expenses across sections, aggregates their totals,
     * and returns the room data with computed total value.
     */
    mapRoom(room: RoomCategoryEntity) {
        let roomTotal = 0;

        const expenses = (room.sections ?? []).flatMap((section) =>
            (section.expenses ?? []).map((expense) => {
                const dto = this.mapExpense(expense);
                roomTotal += dto.total;
                return dto;
            }),
        );

        return {
            id: room.id,
            label: room.label,
            type: room.type,
            expenses,
            total: roomTotal,
        };
    }

    /**
     * Generates the punch list from the analysis builder.
     * Maps room categories by flattening their sections' expenses,
     * and computes the overall project cost with the room breakdown.
     */
    getPunchList(aBuilder: BAnalysisEntity) {
        const rooms = (aBuilder.rooms ?? []).map((room) => this.mapRoom(room));
        const totalProjectCost = rooms.reduce((sum, room) => sum + room.total, 0);

        return { totalProjectCost, rooms };
    }
}
