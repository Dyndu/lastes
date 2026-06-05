import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersCodeEntity } from '../entities/user-code.entity';
import { UserEntity } from '../entities/user.entity';
import { VerifyUserCodeDto } from '../dto';

@Injectable()
export class UserCodeService {
    /**
     * Service responsible for managing user's code
     */
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    /**
     * Retrieves the active user code for a given user ID,
     * throwing an error if none is found.
     */
    async getUserCodeByUserId(id: string) {
        this.usersService.logger.info(`Searching for user code with user id: ${id}`);

        const isUserCodeExist = await this.usersService.userCodeRepo.findOne({
            where: { user: { id }, deleted: false },
            relations: ['user'],
        });

        if (!isUserCodeExist)
            this.usersService.errorHandlerService.notFound(
                `User code with user id ${id} not found`,
                `OTP not found`,
            );

        return isUserCodeExist;
    }

    /**
     * Retrieves the active user code for a given email,
     * throwing an error if none is found.
     */
    async getUserCodeByUserEmail(email: string) {
        this.usersService.logger.info(`Searching for user code with user email: ${email}`);
        const isUserCodeExist = await this.usersService.userCodeRepo.findOne({
            where: {
                user: { email: email.trim(), deleted: false },
                deleted: false,
            },
            relations: ['user'],
        });
        if (!isUserCodeExist)
            this.usersService.errorHandlerService.notFound(
                `User code with user email ${email} not found`,
                `OTP not found`,
            );

        return isUserCodeExist;
    }

    /**
     * Verifies a user’s code by email,
     * checking expiration and validity of the OTP.
     */
    async verifyUserCode(verifyUserCode: VerifyUserCodeDto): Promise<UsersCodeEntity> {
        const { email, code } = verifyUserCode;
        this.usersService.logger.info(
            `Verifying user code with data: ${JSON.stringify(verifyUserCode)}`,
        );
        const isUserCodeExist = await this.getUserCodeByUserEmail(email);
        if (isUserCodeExist.expireAt < new Date())
            this.usersService.errorHandlerService.badRequest(
                `User code has expired at ${isUserCodeExist.expireAt.toISOString()}`,
                `OTP expired`,
            );

        const isCodeMatched = await this.usersService.hashService.comparePassword(
            code,
            isUserCodeExist.code,
        );
        if (!isCodeMatched)
            this.usersService.errorHandlerService.badRequest(
                `User code is not valid`,
                `Invalid OTP`,
            );

        return isUserCodeExist;
    }

    /**
     * Increments the user code attempts,
     * regenerates a new OTP, and applies delay rules if limits are reached.
     */
    async incrementCountAndSetDelayDate(
        userCode: UsersCodeEntity,
    ): Promise<{ data: UsersCodeEntity; code: string }> {
        this.usersService.logger.info(`Incrementing user code count and setting delay date`);
        userCode.count += 1;
        const code = this.usersService.otherUtils.generateNumber(6);
        userCode.code = await this.usersService.hashService.hashPassword(code);
        userCode.expireAt = new Date(Date.now() + 6 * 60 * 1000);

        if (userCode.count >= 5) {
            this.usersService.logger.info(`User code count is 5, setting delay date`);
            userCode.delayDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        await this.usersService.userCodeRepo.update({ id: userCode.id }, userCode);

        const data = await this.getUserCodeByUserId(userCode.user.id);
        return { data, code };
    }

    /**
     * Creates a new user code,
     * or requests a new one if an active code already exists.
     */
    async createUserCode(
        user: UserEntity,
        rememberMe: boolean,
    ): Promise<{ data: UsersCodeEntity; code: string }> {
        this.usersService.logger.info(`Creating user code with data: ${user.id}`);

        const isUserCodeExist = await this.usersService.userCodeRepo.findOne({
            where: { user: { id: user.id }, deleted: false },
        });

        if (isUserCodeExist) return await this.askNewCode(user);

        const code = this.usersService.otherUtils.generateNumber(6);
        const userCode = new UsersCodeEntity();
        [userCode.user, userCode.code, userCode.expireAt, userCode.rememberMe] = [
            user,
            await this.usersService.hashService.hashPassword(code),
            new Date(Date.now() + 6 * 60 * 1000),
            rememberMe,
        ];
        const data = await this.usersService.userCodeRepo.save(userCode);
        return { data, code };
    }

    /**
     * Handles new code requests by checking attempt limits,
     * applying delays if needed, or resetting attempts once expired.
     */
    async askNewCode(user: UserEntity) {
        this.usersService.logger.info(`Creating user code with data: ${user.id}`);
        const isUserCodeExist = await this.getUserCodeByUserId(user.id);

        this.usersService.logger.info('verifying if the user has reached the maximum attempt');

        let result: { data: UsersCodeEntity; code: string };

        if (isUserCodeExist.delayDate && isUserCodeExist.delayDate > new Date()) {
            this.usersService.logger.warn(`User must wait until delay date`);
            const currentDate = new Date();
            const delayDate = isUserCodeExist.delayDate;
            const delayInHours = Math.ceil(
                (delayDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60),
            );

            this.usersService.errorHandlerService.conflict(
                `Too many attempts, please retry in ${delayInHours} hours`,
                `Too many attempts, please retry in ${delayInHours} hours`,
            );
        } else if (isUserCodeExist.delayDate && isUserCodeExist.delayDate < new Date()) {
            this.usersService.logger.info(
                `User code delay date has passed, resetting count and delay date`,
            );
            isUserCodeExist.delayDate = null!;
            isUserCodeExist.count = 0;
            result = await this.incrementCountAndSetDelayDate(isUserCodeExist);
        } else {
            this.usersService.logger.info(`User code count is less than 5, incrementing count`);
            result = await this.incrementCountAndSetDelayDate(isUserCodeExist);
        }

        return { data: result.data, code: result.code };
    }

    /**
     * Deletes the user code linked to the given user ID.
     */
    async deleteUserCode(userId: string) {
        this.usersService.logger.info(`Deleting user code with user ID: ${userId}`);
        await this.usersService.userCodeRepo.delete({
            user: { id: userId, deleted: false },
        });
        return { message: 'Code deleted successfully' };
    }
}
