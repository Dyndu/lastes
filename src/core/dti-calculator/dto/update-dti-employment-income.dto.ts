import { PartialType } from '@nestjs/swagger';
import { CreateDtiEmploymentIncomeDto } from './create-dti-employment-income.dto';

export class UpdateDtiEmploymentIncomeDto extends PartialType(CreateDtiEmploymentIncomeDto) {}
