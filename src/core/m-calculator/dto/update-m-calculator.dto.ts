import { PartialType } from '@nestjs/swagger';
import { CreateMCalculatorDto } from './create-m-calculator.dto';

export class UpdateMCalculatorDto extends PartialType(CreateMCalculatorDto) {}
