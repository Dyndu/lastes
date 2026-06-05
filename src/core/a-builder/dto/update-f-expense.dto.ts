import { PartialType } from '@nestjs/swagger';
import { FExpenseDto } from './f-expense.dto';

export class UpdateFExpenseDto extends PartialType(FExpenseDto) {}
