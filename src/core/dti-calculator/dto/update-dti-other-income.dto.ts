import { PartialType } from '@nestjs/swagger';
import { CreateDtiOtherIncomeDto } from './create-dti-other-income.dto';

export class UpdateDtiOtherIncomeDto extends PartialType(CreateDtiOtherIncomeDto) {}
