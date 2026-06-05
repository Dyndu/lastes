import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Global,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Global()
@Injectable()
export class ErrorHandlerService {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

    /**
     * Logs an internal unauthorized access reason and throws an UnauthorizedException.
     * Uses a customizable public message while keeping internal details for logging purposes.
     */
    unauthorized(internal: string, publicMsg = 'Unauthorized'): never {
        this.logger.error(internal);
        throw new UnauthorizedException(publicMsg);
    }

    /**
     * Logs an internal not-found reason and throws a NotFoundException.
     * Uses a customizable public message while keeping internal details for logging purposes.
     */
    notFound(internal: string, publicMsg = 'Not found'): never {
        this.logger.error(internal);
        throw new NotFoundException(publicMsg);
    }

    /**
     * Logs an internal error message and immediately throws a BadRequestException
     * with an optional public-facing message.
     */
    badRequest(internal: string, publicMsg = 'Bad request'): never {
        this.logger.error(internal);
        throw new BadRequestException(publicMsg);
    }

    /**
     * Logs an internal error message and immediately throws a ForbiddenException
     * with an optional public-facing message.
     */
    forbidden(internal: string, publicMsg = 'Forbidden'): never {
        this.logger.error(internal);
        throw new ForbiddenException(publicMsg);
    }

    /**
     * Logs an internal error message and immediately throws a ConflictException
     * with an optional public-facing message.
     */
    conflict(internal: string, publicMsg = 'Conflict'): never {
        this.logger.error(internal);
        throw new ConflictException(publicMsg);
    }

    /**
     * Logs an internal error message and immediately throws an HttpException
     * with status 422 (Unprocessable Entity) and an optional public-facing message.
     */
    unprocessable(internal: string, publicMsg = 'Unprocessable entities'): never {
        this.logger.error(internal);
        throw new HttpException(publicMsg, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    /**
     * Logs an internal error message and immediately throws an HttpException
     * with status 429 (Too Many Requests) and an optional public-facing message.
     */
    tooManyRequests(internal: string, publicMsg = 'Too many requests'): never {
        this.logger.error(internal);
        throw new HttpException(publicMsg, HttpStatus.TOO_MANY_REQUESTS);
    }

    /**
     * Logs an internal error message and immediately throws an InternalServerErrorException
     * with an optional public-facing message.
     */
    fail(internal: string, publicMsg = 'Internal server error'): never {
        this.logger.error(internal);
        throw new InternalServerErrorException(publicMsg);
    }

    /**
     * Logs validation errors as a warning and returns a BadRequestException
     * containing a standardized message and the detailed field errors.
     */
    validation(errors: Record<string, string>): BadRequestException {
        this.logger.warn(`Validation errors: ${JSON.stringify(errors)}`);
        return new BadRequestException({
            message: 'Validation failed',
            errors,
        });
    }
}
