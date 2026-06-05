import * as indexExports from './index';
import {
    BooleanFieldDecorator,
    EnumFieldDecorator,
    IsDifferentFrom,
    Match,
    NumberFieldDecorator,
    StringArrayFieldDecorator,
    StringFieldDecorator,
    Permissions,
    SuperAdminOnly,
    AdminOrSuperAdminOnly,
    NonAdminOnly,
    DateFieldDecorator,
    PaginationQueryDecorator,
    AdminViewDecorator,
    ApiResponseDecorator,
    ApiParamDecorator,
    ApiOperationDecorator,
    ApiQueryDecorator,
    IsRequiredIf,
    CurrentUser,
    IsValidUrl,
    IsREItemUnique,
    IsValidZipCode,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['BooleanFieldDecorator', BooleanFieldDecorator],
        ['EnumFieldDecorator', EnumFieldDecorator],
        ['IsDifferentFrom', IsDifferentFrom],
        ['Match', Match],
        ['NumberFieldDecorator', NumberFieldDecorator],
        ['StringArrayFieldDecorator', StringArrayFieldDecorator],
        ['StringFieldDecorator', StringFieldDecorator],
        ['Permissions', Permissions],
        ['SuperAdminOnly', SuperAdminOnly],
        ['AdminOrSuperAdminOnly', AdminOrSuperAdminOnly],
        ['NonAdminOnly', NonAdminOnly],
        ['DateFieldDecorator', DateFieldDecorator],
        ['PaginationQueryDecorator', PaginationQueryDecorator],
        ['AdminViewDecorator', AdminViewDecorator],
        ['ApiResponseDecorator', ApiResponseDecorator],
        ['ApiParamDecorator', ApiParamDecorator],
        ['ApiOperationDecorator', ApiOperationDecorator],
        ['ApiQueryDecorator', ApiQueryDecorator],
        ['IsRequiredIf', IsRequiredIf],
        ['CurrentUser', CurrentUser],
        ['IsValidUrl', IsValidUrl],
        ['IsREItemUnique', IsREItemUnique],
        ['IsValidZipCode', IsValidZipCode],
    ] as const;

    it.each(expectedExports)('should re-export %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
