import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GoogleOAuthGuard } from './google-oauth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('GoogleOAuthGuard', () => {
    let guard: GoogleOAuthGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GoogleOAuthGuard],
        }).compile();

        guard = module.get<GoogleOAuthGuard>(GoogleOAuthGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should extend AuthGuard', () => {
        expect(guard).toBeInstanceOf(AuthGuard('google'));
    });

    it('should use google strategy', () => {
        expect(guard).toBeInstanceOf(GoogleOAuthGuard);
    });

    describe('canActivate', () => {
        let mockExecutionContext: ExecutionContext;
        let mockRequest: any;

        beforeEach(() => {
            mockRequest = {
                headers: {},
                user: null,
            };

            mockExecutionContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue(mockRequest),
                }),
                getClass: jest.fn(),
                getHandler: jest.fn(),
                getArgs: jest.fn(),
                getArgByIndex: jest.fn(),
                switchToRpc: jest.fn(),
                switchToWs: jest.fn(),
                getType: jest.fn(),
            } as any;
        });

        it('should call canActivate from parent AuthGuard', async () => {
            const canActivateSpy = jest
                .spyOn(AuthGuard('google').prototype, 'canActivate')
                .mockResolvedValue(true);

            await guard.canActivate(mockExecutionContext);

            expect(canActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
        });

        it('should return true when authentication succeeds', async () => {
            jest.spyOn(AuthGuard('google').prototype, 'canActivate').mockResolvedValue(true);

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(true);
        });

        it('should return false when authentication fails', async () => {
            jest.spyOn(AuthGuard('google').prototype, 'canActivate').mockResolvedValue(false);

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(false);
        });

        it('should throw error when authentication throws', async () => {
            const error = new Error('Authentication failed');
            jest.spyOn(AuthGuard('google').prototype, 'canActivate').mockRejectedValue(error);

            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
                'Authentication failed',
            );
        });
    });

    describe('Integration behavior', () => {
        it('should be injectable', () => {
            expect(guard).toBeInstanceOf(GoogleOAuthGuard);
        });

        it('should have Injectable decorator', () => {
            const metadata = Reflect.getMetadata('__injectable__', GoogleOAuthGuard);
            expect(metadata).toBeDefined();
        });
    });
});
