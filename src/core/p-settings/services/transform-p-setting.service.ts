import { Injectable } from '@nestjs/common';
import { MetricsEntity, PSettingEntity } from '../entities';

@Injectable()
export class TransformPSettingService {
    /**
     * Service responsible for transforming profile setting to ui view
     */

    /**
     * Returns an array containing the 'createdBy' relation name, used for eager-loading the user who created the entities.
     */
    createdBy = () => ['createdBy'];

    /**
     * Returns an array of relation names to eager-load when fetching PSettingEntity profiles.
     * Includes the 'metrics' relation and the nested 'metrics.metric' relation.
     */
    profileEntities = () => ['metrics', 'metrics.metric'];

    /**
     * Returns an array of relation names to include when updating PSettingEntity objects.
     * Ensures 'createdBy', 'metrics', and nested 'metrics.metric' relations are loaded.
     */
    updateSettingEntities = () => ['createdBy', 'metrics', 'metrics.metric'];

    /**
     * Transforms a MetricsEntity into a simplified object containing only its id, label, icon, and description.
     */
    transformMetric = (m: MetricsEntity) => ({
        id: m.id,
        label: m.label,
        icon: m.icon,
        description: m.description,
    });

    /**
     * Transforms an array of MetricsEntity objects into an array of simplified metric objects.
     */
    transformMetrics = (ms: MetricsEntity[]) => ms.map((m) => this.transformMetric(m));

    /**
     * Transforms a PSettingEntity into a structured profile object, including all relevant financial settings and metrics.
     * If metrics are present, they are transformed into simplified metric objects.
     */
    transformProfile = (p: PSettingEntity) => ({
        id: p.id,
        label: p.label,
        isDefault: p.isDefault,
        taxRate: p.taxRate,
        occupancyRate: p.occupancyRate,
        managementFees: p.managementFees,
        maintenanceEscrow: p.maintenanceEscrow,
        cashReserves: p.cashReserves,
        capRate: p.capRate,
        goi: p.goi,
        noi: p.noi,
        ber: p.ber,
        oer: p.oer,
        dscr: p.dscr,
        gmr: p.grm,
        agm: p.agm,
        coc: p.coc,
        cashFlow: p.cashFlow,
        fTermRoi: p.fTermRoi,
        yearlyIncome: p.yearlyIncome,
        roi: p.roi,
        payBackPeriod: p.payBackPeriod,
        onePercent: p.onePercent,
        twoPercent: p.twoPercent,
        fiftyPercent: p.fiftyPercent,
        cashFlowAtLeast: p.cashFlowAtLeast,
        cashNeeded: p.cashNeeded,
        metrics: p.metrics?.length > 0 ? this.transformMetrics(p.metrics.map((m) => m.metric)) : [],
    });

    /**
     * Transforms a PSettingEntity into a simplified object containing only its id, label, and isDefault status.
     */
    transformPSettingAll = (p: PSettingEntity) => ({
        id: p.id,
        label: p.label,
        isDefault: p.isDefault,
    });

    /**
     * Transforms an array of PSettingEntity objects into an array of structured profile objects.
     */
    transformProfiles = (ps: PSettingEntity[]) => ps.map((p) => this.transformPSettingAll(p));
}
