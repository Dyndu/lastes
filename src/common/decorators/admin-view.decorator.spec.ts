import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../guard';
import { AdminOrSuperAdminOnly, Permissions } from './';
import { AdminViewDecorator } from './admin-view.decorator';

jest.mock('@nestjs/common', () => ({
    applyDecorators: jest.fn((...decorators) => decorators),
    UseGuards: jest.fn((...guards) => guards),
}));

jest.mock('@nestjs/swagger', () => ({
    ApiBearerAuth: jest.fn((name) => name),
}));

jest.mock('../guard', () => ({
    JwtAuthGuard: jest.fn(),
    PermissionsGuard: jest.fn(),
}));

jest.mock('./', () => ({
    AdminOrSuperAdminOnly: jest.fn(() => 'AdminOrSuperAdminOnly-decorator'),
    Permissions: jest.fn((options) => options),
}));

describe('AdminViewDecorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(AdminViewDecorator).toBeDefined();
    });

    it('should call applyDecorators', () => {
        AdminViewDecorator('test-ui');

        expect(applyDecorators).toHaveBeenCalledTimes(1);
    });

    it('should call ApiBearerAuth with JWT', () => {
        AdminViewDecorator('test-ui');

        expect(ApiBearerAuth).toHaveBeenCalledTimes(1);
        expect(ApiBearerAuth).toHaveBeenCalledWith('JWT');
    });

    it('should call UseGuards with JwtAuthGuard and PermissionsGuard', () => {
        AdminViewDecorator('test-ui');

        expect(UseGuards).toHaveBeenCalledTimes(1);
        expect(UseGuards).toHaveBeenCalledWith(JwtAuthGuard, PermissionsGuard);
    });

    it('should call AdminOrSuperAdminOnly', () => {
        AdminViewDecorator('test-ui');

        expect(AdminOrSuperAdminOnly).toHaveBeenCalledTimes(1);
        expect(AdminOrSuperAdminOnly).toHaveBeenCalledWith();
    });

    it('should call Permissions with ui and actions array containing "view"', () => {
        const ui = 'test-ui';
        AdminViewDecorator(ui);

        expect(Permissions).toHaveBeenCalledTimes(1);
        expect(Permissions).toHaveBeenCalledWith({
            ui: 'test-ui',
            actions: ['view'],
        });
    });

    it('should pass the ui parameter to Permissions correctly', () => {
        const ui = 'users';
        AdminViewDecorator(ui);

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(permissionsCall.ui).toBe('users');
    });

    it('should always pass "view" in actions array to Permissions', () => {
        AdminViewDecorator('test-ui');

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(permissionsCall.actions).toEqual(['view']);
        expect(permissionsCall.actions).toHaveLength(1);
        expect(permissionsCall.actions[0]).toBe('view');
    });

    it('should call all decorators in correct order', () => {
        AdminViewDecorator('test-ui');

        expect(applyDecorators).toHaveBeenCalledWith(
            'JWT',
            [JwtAuthGuard, PermissionsGuard],
            'AdminOrSuperAdminOnly-decorator',
            { ui: 'test-ui', actions: ['view'] },
        );
    });

    it('should return the result of applyDecorators', () => {
        const mockResult = ['decorator1', 'decorator2', 'decorator3', 'decorator4'];
        (applyDecorators as jest.Mock).mockReturnValue(mockResult);

        const result = AdminViewDecorator('test-ui');

        expect(result).toBe(mockResult);
    });

    it('should work with different ui parameter values', () => {
        const uiValues = ['dashboard', 'settings', 'reports', 'analytics'];

        uiValues.forEach((ui) => {
            jest.clearAllMocks();
            AdminViewDecorator(ui);

            expect(Permissions).toHaveBeenCalledWith({
                ui,
                actions: ['view'],
            });
        });
    });

    it('should handle empty string ui parameter', () => {
        AdminViewDecorator('');

        expect(Permissions).toHaveBeenCalledWith({
            ui: '',
            actions: ['view'],
        });
    });

    it('should handle ui parameter with special characters', () => {
        const specialUi = 'user-management_v2';
        AdminViewDecorator(specialUi);

        expect(Permissions).toHaveBeenCalledWith({
            ui: specialUi,
            actions: ['view'],
        });
    });

    it('should create Permissions object with exactly 2 properties', () => {
        AdminViewDecorator('test-ui');

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(Object.keys(permissionsCall)).toHaveLength(2);
        expect(Object.keys(permissionsCall)).toEqual(['ui', 'actions']);
    });

    it('should ensure actions array is not empty', () => {
        AdminViewDecorator('test-ui');

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(permissionsCall.actions.length).toBeGreaterThan(0);
    });

    it('should call each decorator function exactly once per invocation', () => {
        AdminViewDecorator('test-ui');

        expect(ApiBearerAuth).toHaveBeenCalledTimes(1);
        expect(UseGuards).toHaveBeenCalledTimes(1);
        expect(AdminOrSuperAdminOnly).toHaveBeenCalledTimes(1);
        expect(Permissions).toHaveBeenCalledTimes(1);
        expect(applyDecorators).toHaveBeenCalledTimes(1);
    });

    it('should work when called multiple times sequentially', () => {
        AdminViewDecorator('first-ui');
        expect(Permissions).toHaveBeenCalledWith({
            ui: 'first-ui',
            actions: ['view'],
        });

        jest.clearAllMocks();

        AdminViewDecorator('second-ui');
        expect(Permissions).toHaveBeenCalledWith({
            ui: 'second-ui',
            actions: ['view'],
        });
    });

    it('should pass ui parameter as a string type', () => {
        const ui = 'test-ui';
        AdminViewDecorator(ui);

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(typeof permissionsCall.ui).toBe('string');
    });

    it('should pass actions as an array type', () => {
        AdminViewDecorator('test-ui');

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(permissionsCall.actions)).toBe(true);
    });

    it('should maintain the ui parameter value exactly as provided', () => {
        const originalUi = 'MySpecialUI123';
        AdminViewDecorator(originalUi);

        const permissionsCall = (Permissions as jest.Mock).mock.calls[0][0];
        expect(permissionsCall.ui).toStrictEqual(originalUi);
    });

    it('should include both guards in UseGuards call', () => {
        AdminViewDecorator('test-ui');

        const useGuardsCall = (UseGuards as jest.Mock).mock.calls[0];
        expect(useGuardsCall).toHaveLength(2);
        expect(useGuardsCall[0]).toBe(JwtAuthGuard);
        expect(useGuardsCall[1]).toBe(PermissionsGuard);
    });

    it('should pass guards in correct order to UseGuards', () => {
        AdminViewDecorator('test-ui');

        expect(UseGuards).toHaveBeenCalledWith(JwtAuthGuard, PermissionsGuard);
    });
});
