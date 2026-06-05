import { Controller, Get } from '../../common';
import {
    AdminViewDecorator,
    ApiOperationDecorator,
    ApiResponseDecorator,
} from '../../common/decorators';
import { CategoriesService } from './categories.service';

@AdminViewDecorator('categories')
@Controller('g-categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Get()
    @ApiOperationDecorator('Retrieve all categories', 'Get non deleted categories for guides')
    @ApiResponseDecorator(200, 'Categories retrieved successfully.')
    @ApiResponseDecorator(403, 'Forbidden, access denied for categories.')
    async allCats() {
        return this.categoriesService.allCategories();
    }
}
