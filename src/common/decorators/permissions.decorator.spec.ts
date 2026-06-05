import { SetMetadata } from '@nestjs/common';
import {
    Permissions,
    SuperAdminOnly,
    AdminOrSuperAdminOnly,
    NonAdminOnly,
} from './permissions.decorator';

jest.mock('@nestjs/common', () => ({
    SetMetadata: jest.fn(() => 'mockedReturn'),
}));

describe('Custom Decorators', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Permissions should call SetMetadata with key "permissions" and the provided object', () => {
        const permissions = { ui: 'dashboard', actions: ['read', 'write'] };

        const result = Permissions(permissions);

        expect(SetMetadata).toHaveBeenCalledWith('permissions', permissions);
        expect(result).toBe('mockedReturn');
    });

    it('SuperAdminOnly should call SetMetadata with key "superAdminOnly" and true', () => {
        const result = SuperAdminOnly();

        expect(SetMetadata).toHaveBeenCalledWith('superAdminOnly', true);
        expect(result).toBe('mockedReturn');
    });

    it('AdminOrSuperAdminOnly should call SetMetadata with key "adminOrSuperAdminOnly" and true', () => {
        const result = AdminOrSuperAdminOnly();

        expect(SetMetadata).toHaveBeenCalledWith('adminOrSuperAdminOnly', true);
        expect(result).toBe('mockedReturn');
    });

    it('NonAdminOnly should call SetMetadata with key "nonAdminOnly" and true', () => {
        const result = NonAdminOnly();

        expect(SetMetadata).toHaveBeenCalledWith('nonAdminOnly', true);
        expect(result).toBe('mockedReturn');
    });
});
