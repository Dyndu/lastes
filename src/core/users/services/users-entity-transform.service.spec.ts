import { Test, TestingModule } from '@nestjs/testing';
import { UsersEntityTransformService } from './users-entity-transform.service';
import { UsersService } from './users.service';
import { UserEntity } from '../entities/user.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { UserStatusEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UsersEntityTransformService', () => {
    let service: UsersEntityTransformService;
    let usersService: any;

    beforeEach(async () => {
        usersService = {
            permsService: {
                transformPermsGroupedByUi: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersEntityTransformService,
                { provide: UsersService, useValue: usersService },
            ],
        }).compile();

        service = module.get(UsersEntityTransformService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('transformFiles', () => {
        it('should transform file entities', () => {
            const file: FileEntity = {
                id: 1,
                label: 'file',
                path: '/file',
                size: 100,
                type: 'image/png',
                width: 10,
                height: 20,
            } as any;

            expect(service.transformFiles(file)).toEqual(file);
        });
    });

    describe('transformEntity', () => {
        it('should transform entities', () => {
            expect(service.transformEntity({ id: 1, label: 'Admin' })).toEqual({
                id: 1,
                label: 'Admin',
            });
        });
    });

    describe('toConnectedUserInfo', () => {
        it('should return permissions when group has permissions', () => {
            usersService.permsService.transformPermsGroupedByUi.mockReturnValue([
                { ui: 'users', perms: [] },
            ]);

            const user: UserEntity = {
                id: 1,
                fullname: 'John',
                email: 'john@test.com',
                password: 'hashed',
                role: { id: 1, label: 'admin' },
                group: {
                    id: 2,
                    label: 'Group',
                    permissions: [{ id: 1 }],
                },
                avatar: null,
            } as any;

            const result = service.toConnectedUserInfo(user);

            expect(usersService.permsService.transformPermsGroupedByUi).toHaveBeenCalled();

            expect(result.permissions).toEqual([{ ui: 'users', perms: [] }]);
        });

        it('should return empty permissions when no group', () => {
            const user: UserEntity = {
                id: 2,
                fullname: 'Jane',
                email: 'jane@test.com',
                password: undefined,
                role: { id: 2, label: 'user' },
                group: null,
                avatar: null,
            } as any;

            const result = service.toConnectedUserInfo(user);

            expect(result.permissions).toEqual([]);
            expect(result.hasPassword).toBe(false);
        });
    });

    describe('transformAdmin', () => {
        it('should transform admin user', () => {
            const user: UserEntity = {
                id: 1,
                fullname: 'Admin',
                status: UserStatusEnum.ACTIVE,
                role: { id: 1, label: 'admin' },
                group: null,
                avatar: null,
                createdAt: '2024-01-01T00:00:00Z',
            } as any;

            const result = service.transformAdmin(user);

            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.status).toBe(UserStatusEnum.ACTIVE);
        });
    });

    describe('transformAdmins', () => {
        it('should map users', () => {
            const users = [{ id: 1, fullname: 'A', role: { id: 1, label: 'admin' } }] as any;

            const result = service.transformAdmins(users);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });
    });
});
