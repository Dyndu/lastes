import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class CreateMExportDto {
    @StringFieldDecorator('Label of the template', 'Template 1', 2, false)
    label?: string;

    @StringFieldDecorator('Company name of the template', 'Soft Vodooz', 2)
    companyName: string;

    @StringFieldDecorator('Phone number of the company', '+22908009090', 2)
    phoneNumber: string;

    @StringFieldDecorator('Address of the template', 'Template 1', 2)
    address: string;

    @StringFieldDecorator('Email of the template', 'Template 1', 2, true, true)
    email: string;

    @StringFieldDecorator('File', 'eb5174d5-1cef-40f6-bb57-97393cde0426', 2)
    @IsUUID('4')
    file: string;
}
