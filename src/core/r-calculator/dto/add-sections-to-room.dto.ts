import { StringArrayFieldDecorator } from '../../../common/decorators';

export class AddSectionsToRoomDto {
    @StringArrayFieldDecorator('Labels of new sections', ['Roof', 'Kitchen', 'Toilets'], 1, true)
    labels: string[];
}
