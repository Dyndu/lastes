import {
    DateFieldDecorator,
    EnumFieldDecorator,
    NumberFieldDecorator,
    StringFieldDecorator,
} from '../../../common/decorators';
import { IsUUID } from 'class-validator';
import { AdsFormatEnum, AdsTypeEnum } from '../../../common/enum';

export class CreateAdsDto {
    @StringFieldDecorator('Label or title of the the add', '300% BONUS', 3)
    label: string;

    @StringFieldDecorator('Name of the company', '1x bet', 3)
    companyName: string;

    @StringFieldDecorator('Ads file', '759669c6-d2d0-42fa-860c-93cba1838ea6', 2)
    @IsUUID('4')
    fileId: string;

    @EnumFieldDecorator(AdsTypeEnum, 'Status of the guide', {
        example: AdsTypeEnum.STANDARD,
        required: true,
        isArray: false,
    })
    type: AdsTypeEnum;

    @EnumFieldDecorator(AdsFormatEnum, 'Status of the guide', {
        example: AdsFormatEnum.HORIZONTAL,
        required: true,
        isArray: false,
    })
    format: AdsFormatEnum;

    @DateFieldDecorator('Start date of the add', '2026-12-01T00:00:00.000Z', {
        required: true,
    })
    startDate: Date;

    @DateFieldDecorator('Start date of the add', '2026-12-01T00:00:00.000Z', {
        required: true,
    })
    endDate: Date;

    @NumberFieldDecorator('amount of the ad', 100, {
        required: true,
        allowNegative: false,
    })
    amount: number;
}
