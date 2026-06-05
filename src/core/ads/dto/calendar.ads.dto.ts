import { DateFieldDecorator } from '../../../common/decorators';

export class CalendarAdsDto {
    @DateFieldDecorator('Start date of the add', '2026-12-01T00:00:00.000Z', {
        required: true,
    })
    date: Date;
}
