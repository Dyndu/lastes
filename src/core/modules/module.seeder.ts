import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ModuleLabelEnum, ModuleTypeEnum } from '../../common/enum';
import { ModulesRepository } from './repositories';
import { ModuleEntity } from './entities';

const createModule = (label: string, type: ModuleTypeEnum, color: string) => ({
    label,
    type,
    color,
});

const allModules = [
    createModule(ModuleLabelEnum.RENTAL_ANALYZER, ModuleTypeEnum.MODULE, '#DC6803'),
    createModule(ModuleLabelEnum.FIX_FLIP_ANALYZER, ModuleTypeEnum.MODULE, '#A04FCD'),
    createModule(ModuleLabelEnum.REHAB_CALCULATOR, ModuleTypeEnum.MODULE, '#3F53B2'),
    createModule(ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER, ModuleTypeEnum.MODULE, '#EEB109'),
    createModule(ModuleLabelEnum.BRRRR_ANALYZER, ModuleTypeEnum.MODULE, '#2CBECA'),
    createModule(ModuleLabelEnum.WHOLESALE_ANALYZER, ModuleTypeEnum.MODULE, '#36A756'),
    createModule(ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER, ModuleTypeEnum.MODULE, '#C01048'),
    createModule(ModuleLabelEnum.DTI_CALCULATOR, ModuleTypeEnum.TOOLS, '#80C95A'),
    createModule(ModuleLabelEnum.MORTGAGE_CALCULATOR, ModuleTypeEnum.TOOLS, '#71B780'),
];

@Injectable()
export class ModuleSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly moduleRepository: ModulesRepository,
    ) {}

    async seed() {
        this.logger.info('Seeding modules seed');
        const existingModules = await this.moduleRepository.find({
            where: { deleted: false },
        });

        if (existingModules.length < 9) {
            await this.moduleRepository.delete({ deleted: false });
            const modules = allModules.map((m) => {
                const result = new ModuleEntity();
                result.label = m.label.trim();
                result.type = m.type;
                result.color = m.color;
                result.icon = m.label.toLowerCase().trim().replaceAll(/\s+/g, '-');

                return result;
            });

            await this.moduleRepository.createMany(modules);
        }

        this.logger.info(`Module seed successfully ended`);
    }
}
