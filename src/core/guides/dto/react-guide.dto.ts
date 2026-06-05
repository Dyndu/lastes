import { GuideReactionEnum } from '../../../common/enum';
import { EnumFieldDecorator } from '../../../common/decorators';

export class ReactGuideDto {
    @EnumFieldDecorator(GuideReactionEnum, 'Reaction to guide by user', {
        example: GuideReactionEnum.LIKE,
        required: false,
        nullable: true,
    })
    reaction?: GuideReactionEnum | null;
}
