import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { ResetPasswordRequestEntity } from '../entities/reset-password-request.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class ResetPasswordRequestService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    /**
     * Validates the delay date in a password reset request to ensure it is not in the future.
     * Calculates the time difference between the current time and the delay date,
     * and returns an error if the user must wait before requesting another link.
     */
    private validateRequestDates(request: ResetPasswordRequestEntity) {
        const now = new Date();

        if (request.delayDate && request.delayDate > now) {
            const timeDiff = request.delayDate.getTime() - now.getTime();
            const [hours, minutes] = [
                Math.floor(timeDiff / (1000 * 60 * 60)),
                Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)),
            ];
            this.usersService.errorHandlerService.forbidden(
                `Request count has been reached ${request.count}, user has to wait till ${request.delayDate.toISOString()} (${hours} ${minutes})`,
                `You must wait ${hours} hours and ${minutes} minutes before requesting another link.`,
            );
        }
    }

    /**
     * Ensures a reset password request is still valid,
     * throwing an error if the request has expired.
     */
    private ensureResetPasswordRequestIsValid(request: ResetPasswordRequestEntity) {
        if (request.expireAt < new Date())
            this.usersService.errorHandlerService.notFound(
                `Reset password request expired with id: ${request.id}`,
                'Reset password request expired',
            );
    }

    /**
     * Retrieves a reset password request by its ID,
     * ensuring the request exists and is not deleted.
     * Throws an error if no matching request is found.
     */
    async retrieveResetPasswordById(id: string) {
        this.usersService.logger.info(`Retrieve a reset password request by id: ${id}`);

        const result = await this.usersService.rPRequestRepo.findOne({
            where: { id, deleted: false },
            relations: ['user'],
        });

        if (!result)
            this.usersService.errorHandlerService.notFound(
                `Reset password request not found with id: ${id}`,
                `Can't reset or update password`,
            );

        return result;
    }
    /**
     * Creates a new reset password request for a user,
     * initializing expiration date and attempt count.
     */
    async createNewRequest(user: UserEntity, passwordExpireAt: Date) {
        this.usersService.logger.info(`Create a new reset password request for user ${user.id}`);

        const result = new ResetPasswordRequestEntity();
        [result.user, result.expireAt, result.count] = [user, passwordExpireAt, 1];

        return this.usersService.rPRequestRepo.create(result);
    }

    /**
     * Handles the process of creating or updating a reset password request for a user.
     * Checks for existing requests and validate the request dates.
     * Update the existing request or create a new one if none exists.
     * Returns the updated or newly created reset password request.
     */
    async handleResetPasswordRequest(user: UserEntity) {
        const isRequestExist = await this.usersService.rPRequestRepo.findOne({
            where: { user: { id: user.id }, deleted: false },
        });

        const passwordExpireAt = new Date(Date.now() + 6 * 60 * 1000);

        if (!isRequestExist) return await this.createNewRequest(user, passwordExpireAt);

        this.validateRequestDates(isRequestExist);

        isRequestExist.count += 1;
        isRequestExist.expireAt = passwordExpireAt;

        if (isRequestExist.count >= 5)
            isRequestExist.delayDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.usersService.rPRequestRepo.update({ id: isRequestExist.id }, isRequestExist);
        return isRequestExist;
    }

    /**
     * Retrieves a reset password request by its ID and validates its expiration status.
     * Fetches the request details along with related user and office information.
     * Returns the associated user if the request is valid and not expired.
     * Handles errors for not found or expired requests.
     */
    async getResetPasswordRequestById(id: string) {
        this.usersService.logger.info(
            `Check if a reset password request exist && link hasn't expired to generate another one`,
        );

        const isRequestExist = await this.retrieveResetPasswordById(id);
        const isUserExist = isRequestExist.user;
        this.ensureResetPasswordRequestIsValid(isRequestExist);

        return isUserExist;
    }

    /**
     * Deletes a reset password request for a user based on their user ID.
     * Logs the deletion process and removes the request from the repository.
     * Returns a success message upon completion.
     */
    async deleteResetPasswordRequest(userId: string): Promise<object> {
        this.usersService.logger.info(`Deleting reset password request for user ID: ${userId}`);
        await this.usersService.rPRequestRepo.delete({
            user: { id: userId, deleted: false },
        });
        return { message: 'Request deleted successfully' };
    }
}
