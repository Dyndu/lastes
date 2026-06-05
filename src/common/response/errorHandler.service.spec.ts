import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from './errorHandler.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;
    let logger: jest.Mocked<Logger>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ErrorHandlerService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: {
                        error: jest.fn(),
                        warn: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ErrorHandlerService>(ErrorHandlerService);
        logger = module.get(WINSTON_MODULE_PROVIDER);
    });

    describe('unauthorized', () => {
        it('should throw UnauthorizedException with default message', () => {
            const internalMsg = 'User not authenticated';

            expect(() => service.unauthorized(internalMsg)).toThrow(
                new UnauthorizedException('Unauthorized'),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw UnauthorizedException with custom message', () => {
            const internalMsg = 'User not authenticated';
            const publicMsg = 'Invalid credentials';

            expect(() => service.unauthorized(internalMsg, publicMsg)).toThrow(
                new UnauthorizedException(publicMsg),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('notFound', () => {
        it('should throw NotFoundException with default message', () => {
            const internalMsg = 'Resource not found';

            expect(() => service.notFound(internalMsg)).toThrow(new NotFoundException('Not found'));

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw NotFoundException with custom message', () => {
            const internalMsg = 'Resource not found';
            const publicMsg = 'User not found';

            expect(() => service.notFound(internalMsg, publicMsg)).toThrow(
                new NotFoundException(publicMsg),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('badRequest', () => {
        it('should throw BadRequestException with default message', () => {
            const internalMsg = 'Bad request';

            expect(() => service.badRequest(internalMsg)).toThrow(
                new BadRequestException('Bad request'),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw BadRequestException with custom message', () => {
            const internalMsg = 'Bad request';
            const publicMsg = 'Bad request';

            expect(() => service.badRequest(internalMsg, publicMsg)).toThrow(
                new BadRequestException(publicMsg),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('forbidden', () => {
        it('should throw ForbiddenException with default message', () => {
            const internalMsg = `Forbidden can't process`;

            expect(() => service.forbidden(internalMsg)).toThrow(
                new ForbiddenException('Forbidden'),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw ForbiddenException with custom message', () => {
            const internalMsg = `Forbidden can't process`;
            const publicMsg = 'Forbidden action';

            expect(() => service.forbidden(internalMsg, publicMsg)).toThrow(
                new ForbiddenException(publicMsg),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('conflict', () => {
        it('should throw ConflictException with default message', () => {
            const internalMsg = 'Resource already exist';

            expect(() => service.conflict(internalMsg)).toThrow(new ConflictException('Conflict'));

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw ConflictException with custom message', () => {
            const internalMsg = 'Resource already exist';
            const publicMsg = 'User already exist';

            expect(() => service.conflict(internalMsg, publicMsg)).toThrow(
                new ConflictException(publicMsg),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('unprocessable', () => {
        it('should throw UNPROCESSABLE_ENTITY with default message', () => {
            const internalMsg = 'Unprocessable entities';

            expect(() => service.unprocessable(internalMsg)).toThrow(
                new HttpException('Unprocessable entities', HttpStatus.UNPROCESSABLE_ENTITY),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw UNPROCESSABLE_ENTITY with custom message', () => {
            const internalMsg = 'Unprocessable entities';
            const publicMsg = 'Unprocessable entities';

            expect(() => service.unprocessable(internalMsg, publicMsg)).toThrow(
                new HttpException(publicMsg, HttpStatus.UNPROCESSABLE_ENTITY),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('tooManyRequests', () => {
        it('should throw ConflictException with default message', () => {
            const internalMsg = 'Too many request sent';

            expect(() => service.tooManyRequests(internalMsg)).toThrow(
                new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw ConflictException with custom message', () => {
            const internalMsg = 'Too many request sent';
            const publicMsg = 'Many request';

            expect(() => service.tooManyRequests(internalMsg, publicMsg)).toThrow(
                new HttpException(publicMsg, HttpStatus.TOO_MANY_REQUESTS),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('fail', () => {
        it('should throw ConflictException with default message', () => {
            const internalMsg = 'Internal server error';

            expect(() => service.fail(internalMsg)).toThrow(
                new InternalServerErrorException('Internal server error'),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });

        it('should throw ConflictException with custom message', () => {
            const internalMsg = 'Internal server error';
            const publicMsg = 'Internal server error';

            expect(() => service.fail(internalMsg, publicMsg)).toThrow(
                new InternalServerErrorException(publicMsg),
            );

            expect(logger.error).toHaveBeenCalledWith(internalMsg);
        });
    });

    describe('validation', () => {
        it('should return BadRequestException with validation errors', () => {
            const errors = {
                email: 'Invalid email format',
                password: 'Password too short',
            };

            const result = service.validation(errors);

            expect(result).toBeInstanceOf(BadRequestException);
            expect(result.getResponse()).toEqual({
                message: 'Validation failed',
                errors,
            });

            expect(logger.warn).toHaveBeenCalledWith(
                `Validation errors: ${JSON.stringify(errors)}`,
            );
        });
    });
});
