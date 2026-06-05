import { Test, TestingModule } from '@nestjs/testing';
import { MExportService } from './m-export.service';
import { ModulesService } from './modules.service';
import { UserEntity } from '../../users/entities/user.entity';
import { MExportEntity } from '../entities';
import { CreateMExportDto, UpdateMExportDto } from '../dto';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { FileUsageEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeUser = (id = 'user-1'): UserEntity => ({ id }) as UserEntity;

const makeFile = (id = 'file-1'): FileLinksEntity => ({ id }) as FileLinksEntity;

const makeMExport = (overrides: Partial<MExportEntity> = {}): MExportEntity =>
    ({
        id: 'export-1',
        label: 'Template 1',
        companyName: 'Acme',
        phoneNumber: '+22900000000',
        address: '1 Rue A',
        email: 'acme@test.com',
        file: makeFile(),
        deleted: false,
        createdBy: makeUser(),
        ...overrides,
    }) as MExportEntity;

const buildModulesServiceMock = () => ({
    logger: { info: jest.fn() },
    errorHandler: {
        notFound: jest.fn((msg: string, label: string) => {
            throw new Error(label);
        }),
        validation: jest.fn((errors: Record<string, string>) => {
            const err = new Error('Validation error');
            (err as any).errors = errors;
            return err;
        }),
    },
    otherUtils: {
        formatCriteria: jest.fn((c: Record<string, any>) => JSON.stringify(c)),
        validateAndParsePhone: jest.fn(),
    },
    mExportRepository: {
        count: jest.fn(),
        find: jest.fn(),
        findActiveOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        assertUniqueActive: jest.fn(),
    },
    fileLinksService: {
        linkFileToEntity: jest.fn(),
        unlinkAndCleanup: jest.fn(),
    },
});

describe('MExportService', () => {
    let service: MExportService;
    let modulesService: ReturnType<typeof buildModulesServiceMock>;

    beforeEach(async () => {
        modulesService = buildModulesServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [MExportService, { provide: ModulesService, useValue: modulesService }],
        }).compile();

        service = module.get<MExportService>(MExportService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('buildMExportEntity', () => {
        it('should return a populated MExportEntity', () => {
            const user = makeUser();
            const file = makeFile();
            const result = service.buildMExportEntity({
                label: 'Template 1',
                companyName: 'Acme',
                phoneNumber: '+22900000000',
                address: '1 Rue A',
                email: 'acme@test.com',
                createdBy: user,
                file,
            });

            expect(result).toBeInstanceOf(MExportEntity);
            expect(result.label).toBe('Template 1');
            expect(result.companyName).toBe('Acme');
            expect(result.phoneNumber).toBe('+22900000000');
            expect(result.address).toBe('1 Rue A');
            expect(result.email).toBe('acme@test.com');
            expect(result.createdBy).toBe(user);
            expect(result.file).toBe(file);
        });

        it('should return entity without file when file is omitted', () => {
            const user = makeUser();
            const result = service.buildMExportEntity({
                label: 'Template 2',
                companyName: 'Corp',
                phoneNumber: '+22900000001',
                address: '2 Rue B',
                email: 'corp@test.com',
                createdBy: user,
            });

            expect(result).toBeInstanceOf(MExportEntity);
            expect(result.file).toBeUndefined();
        });
    });

    describe('generateLabel', () => {
        it('should return "Template 1" when no templates exist', async () => {
            modulesService.mExportRepository.count.mockResolvedValue(0);
            const label = await service.generateLabel(makeUser());
            expect(label).toBe('Template 1');
        });

        it('should return "Template 4" when 3 templates already exist', async () => {
            modulesService.mExportRepository.count.mockResolvedValue(3);
            const label = await service.generateLabel(makeUser());
            expect(label).toBe('Template 4');
        });

        it('should query only non-deleted templates for the correct user', async () => {
            const user = makeUser('user-42');
            modulesService.mExportRepository.count.mockResolvedValue(0);
            await service.generateLabel(user);
            expect(modulesService.mExportRepository.count).toHaveBeenCalledWith({
                where: { createdBy: { id: 'user-42' }, deleted: false },
            });
        });
    });

    describe('userMExports', () => {
        it('should return active exports for the given user', async () => {
            const user = makeUser();
            const exports = [makeMExport()];
            modulesService.mExportRepository.find.mockResolvedValue(exports);

            const result = await service.userMExports(user);

            expect(result).toBe(exports);
            expect(modulesService.mExportRepository.find).toHaveBeenCalledWith({
                where: { createdBy: { id: user.id }, deleted: false },
                relations: undefined,
            });
        });

        it('should forward the relations parameter', async () => {
            const user = makeUser();
            modulesService.mExportRepository.find.mockResolvedValue([]);

            await service.userMExports(user, ['file', 'createdBy']);

            expect(modulesService.mExportRepository.find).toHaveBeenCalledWith({
                where: { createdBy: { id: user.id }, deleted: false },
                relations: ['file', 'createdBy'],
            });
        });
    });

    describe('retrieveMExportByCriteria', () => {
        it('should return the entity when found', async () => {
            const entity = makeMExport();
            modulesService.mExportRepository.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveMExportByCriteria({ id: 'export-1' });

            expect(result).toBe(entity);
            expect(modulesService.logger.info).toHaveBeenCalled();
        });

        it('should throw not-found when entity does not exist', async () => {
            modulesService.mExportRepository.findActiveOne.mockResolvedValue(null);

            await expect(service.retrieveMExportByCriteria({ id: 'ghost' })).rejects.toThrow(
                'Data not found',
            );

            expect(modulesService.errorHandler.notFound).toHaveBeenCalled();
        });

        it('should forward optional relations', async () => {
            const entity = makeMExport();
            modulesService.mExportRepository.findActiveOne.mockResolvedValue(entity);

            await service.retrieveMExportByCriteria({ id: 'export-1' }, ['file']);

            expect(modulesService.mExportRepository.findActiveOne).toHaveBeenCalledWith(
                modulesService.mExportRepository,
                { id: 'export-1' },
                ['file'],
            );
        });
    });

    describe('updateMExport', () => {
        it('should return early message when no itemized data provided', async () => {
            const result = await service.updateMExport(makeMExport(), undefined);
            expect(result).toEqual({ message: 'No updates provided for holding coast' });
            expect(modulesService.mExportRepository.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is empty object', async () => {
            const result = await service.updateMExport(makeMExport(), {});
            expect(result).toEqual({ message: 'No updates provided for holding coast' });
        });

        it('should persist only non-empty trimmed fields', async () => {
            const entity = makeMExport();
            modulesService.mExportRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateMExport(entity, {
                label: '  New Label  ',
                companyName: '  NewCorp  ',
                phoneNumber: '',
                address: undefined,
                email: 'new@test.com',
            });

            expect(modulesService.mExportRepository.update).toHaveBeenCalledWith(
                { id: entity.id },
                {
                    label: 'New Label',
                    companyName: 'NewCorp',
                    email: 'new@test.com',
                },
            );
        });

        it('should update all string fields when all provided', async () => {
            const entity = makeMExport();
            modulesService.mExportRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateMExport(entity, {
                label: 'L',
                companyName: 'C',
                phoneNumber: 'P',
                address: 'A',
                email: 'E',
            });

            expect(modulesService.mExportRepository.update).toHaveBeenCalledWith(
                { id: entity.id },
                { label: 'L', companyName: 'C', phoneNumber: 'P', address: 'A', email: 'E' },
            );
        });
    });

    describe('checkUniqueFields', () => {
        const user = makeUser();
        const dto: Partial<CreateMExportDto> = {
            companyName: 'Acme',
            phoneNumber: '+229',
            address: '1 Rue A',
            email: 'acme@test.com',
        };

        it('should not throw when no duplicates exist', async () => {
            modulesService.mExportRepository.assertUniqueActive.mockResolvedValue(undefined);
            await expect(service.checkUniqueFields(user, dto)).resolves.toBeUndefined();
        });

        it('should check all 4 base fields', async () => {
            modulesService.mExportRepository.assertUniqueActive.mockResolvedValue(undefined);
            await service.checkUniqueFields(user, dto);
            // 4 base fields, no label
            expect(modulesService.mExportRepository.assertUniqueActive).toHaveBeenCalledTimes(4);
        });

        it('should also check label when provided', async () => {
            modulesService.mExportRepository.assertUniqueActive.mockResolvedValue(undefined);
            await service.checkUniqueFields(user, { ...dto, label: 'Template 1' });
            expect(modulesService.mExportRepository.assertUniqueActive).toHaveBeenCalledTimes(5);
        });

        it('should throw validation error when assertUniqueActive populates errors', async () => {
            modulesService.mExportRepository.assertUniqueActive.mockImplementation(
                (_repo, errors: Record<string, string>, criteria) => {
                    if ('companyName' in criteria) errors['companyName'] = 'Already used';
                },
            );

            await expect(service.checkUniqueFields(user, dto)).rejects.toThrow('Validation error');
            expect(modulesService.errorHandler.validation).toHaveBeenCalledWith({
                companyName: 'Already used',
            });
        });

        it('should forward the id parameter to assertUniqueActive', async () => {
            modulesService.mExportRepository.assertUniqueActive.mockResolvedValue(undefined);
            await service.checkUniqueFields(user, dto, 'export-1');

            const calls = modulesService.mExportRepository.assertUniqueActive.mock.calls;
            calls.forEach((call) => expect(call[3]).toBe('Export template'));
        });
    });

    describe('createMExport', () => {
        const user = makeUser();
        const dto: CreateMExportDto = {
            companyName: 'Acme',
            phoneNumber: '+22900000000',
            address: '1 Rue A',
            email: 'acme@test.com',
            file: 'file-uuid',
        } as any;

        beforeEach(() => {
            modulesService.otherUtils.validateAndParsePhone.mockReturnValue(undefined);
            modulesService.mExportRepository.assertUniqueActive.mockResolvedValue(undefined);
            modulesService.mExportRepository.count.mockResolvedValue(0);
            modulesService.fileLinksService.linkFileToEntity.mockResolvedValue(makeFile());
            modulesService.mExportRepository.create.mockImplementation((e) => e);
        });

        it('should create and return the export entity', async () => {
            const result = await service.createMExport(user, dto);

            expect(modulesService.otherUtils.validateAndParsePhone).toHaveBeenCalledWith(
                dto.phoneNumber,
            );
            expect(modulesService.fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                dto.file,
                FileUsageEnum.MODULE_EXPORT,
            );
            expect(modulesService.mExportRepository.create).toHaveBeenCalled();
            expect(result).toBeInstanceOf(MExportEntity);
        });

        it('should auto-generate label when dto.label is not provided', async () => {
            modulesService.mExportRepository.count.mockResolvedValue(2);
            await service.createMExport(user, dto);

            const createdWith: MExportEntity =
                modulesService.mExportRepository.create.mock.calls[0][0];
            expect(createdWith.label).toBe('Template 3');
        });

        it('should use dto.label when provided', async () => {
            await service.createMExport(user, { ...dto, label: 'My Label' } as any);

            const createdWith: MExportEntity =
                modulesService.mExportRepository.create.mock.calls[0][0];
            expect(createdWith.label).toBe('My Label');
            expect(modulesService.mExportRepository.count).not.toHaveBeenCalled();
        });
    });

    describe('mExportUpdate', () => {
        const user = makeUser();
        const dto: UpdateMExportDto = {
            companyName: 'NewCorp',
            phoneNumber: '+22900000099',
            address: '9 Rue Z',
            email: 'new@test.com',
        } as any;

        beforeEach(() => {
            modulesService.mExportRepository.findActiveOne.mockResolvedValue(makeMExport());
            modulesService.otherUtils.formatCriteria.mockReturnValue('{}');
            modulesService.otherUtils.validateAndParsePhone.mockReturnValue(undefined);
            modulesService.mExportRepository.assertUniqueActive.mockResolvedValue(undefined);
            modulesService.mExportRepository.update.mockResolvedValue({ affected: 1 });
        });

        it('should return success message on valid update', async () => {
            const result = await service.mExportUpdate(user, dto, 'export-1');
            expect(result).toEqual({ message: 'Data updated successfully' });
        });

        it('should forward relations to retrieveMExportByCriteria', async () => {
            await service.mExportUpdate(user, dto, 'export-1', ['file', 'createdBy']);

            expect(modulesService.mExportRepository.findActiveOne).toHaveBeenCalledWith(
                modulesService.mExportRepository,
                { createdBy: { id: user.id }, id: 'export-1' },
                ['file', 'createdBy'],
            );
        });

        it('should call retrieveMExportByCriteria with undefined relations when not provided', async () => {
            await service.mExportUpdate(user, dto, 'export-1');

            expect(modulesService.mExportRepository.findActiveOne).toHaveBeenCalledWith(
                modulesService.mExportRepository,
                { createdBy: { id: user.id }, id: 'export-1' },
                undefined,
            );
        });

        it('should validate phone when dto.phoneNumber is present', async () => {
            await service.mExportUpdate(user, dto, 'export-1');
            expect(modulesService.otherUtils.validateAndParsePhone).toHaveBeenCalledWith(
                dto.phoneNumber,
            );
        });

        it('should NOT validate phone when dto.phoneNumber is absent', async () => {
            const dtoNoPhone = { ...dto, phoneNumber: undefined };
            await service.mExportUpdate(user, dtoNoPhone as any, 'export-1');
            expect(modulesService.otherUtils.validateAndParsePhone).not.toHaveBeenCalled();
        });

        it('should unlink old file and link new one when dto.file is provided', async () => {
            const newFile = makeFile('file-new');
            modulesService.fileLinksService.unlinkAndCleanup.mockResolvedValue(undefined);
            modulesService.fileLinksService.linkFileToEntity.mockResolvedValue(newFile);

            await service.mExportUpdate(user, { ...dto, file: 'new-file-uuid' } as any, 'export-1');

            expect(modulesService.fileLinksService.unlinkAndCleanup).toHaveBeenCalledWith('file-1');
            expect(modulesService.fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'new-file-uuid',
                FileUsageEnum.MODULE_EXPORT,
            );
        });

        it('should NOT touch file service when dto.file is absent', async () => {
            await service.mExportUpdate(user, dto, 'export-1');
            expect(modulesService.fileLinksService.unlinkAndCleanup).not.toHaveBeenCalled();
            expect(modulesService.fileLinksService.linkFileToEntity).not.toHaveBeenCalled();
        });

        it('should propagate error when retrieveMExportByCriteria throws', async () => {
            modulesService.mExportRepository.findActiveOne.mockResolvedValue(null);
            await expect(service.mExportUpdate(user, dto, 'ghost')).rejects.toThrow(
                'Data not found',
            );
        });
    });
});
