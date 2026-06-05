import { PartialType } from '@nestjs/swagger';
import { CreateDtiOtherDebtDto } from './create-dti-other-debt.dto';

export class UpdateDtiOtherDebtDto extends PartialType(CreateDtiOtherDebtDto) {}
