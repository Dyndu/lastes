import { BadRequestException, Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import UAParser from 'ua-parser-js';
import path from 'node:path';
import * as crypto from 'node:crypto';
import * as handlebars from 'handlebars';
import * as fs from 'node:fs';
import sanitizeHtml from 'sanitize-html';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
    DeviceTypeEnum,
    ExistenceCheckModeEnum,
    FileTypeEnum,
    UsagePeriod,
} from '../../common/enum';
import { ErrorHandlerService } from '../../common/response';
import { subDays, subMonths, subWeeks, subYears } from 'date-fns';

@Injectable()
export class ConfigUtils {
    /**
     * Parses a string into a number and validates its correctness.
     * Throws an error with a descriptive message if the value is not a valid number.
     */
    parseNumber(value: string, key: string): number {
        if (value === '' || value === null || value === undefined)
            throw new Error(`Configuration ${key} must be a valid number, got: ${value}`);
        const num = Number(value);
        if (Number.isNaN(num))
            throw new Error(`Configuration ${key} must be a valid number, got: ${value}`);
        return num;
    }

    /**
     * Parses a string into a boolean value and validates its correctness.
     * Accepts 'true', '1', 'yes' as true and 'false', '0', 'no', or empty string as false.
     * Throws an error with a descriptive message if the value cannot be interpreted as boolean.
     */
    parseBoolean(value: string, key: string): boolean {
        const normalized = value.toLowerCase().trim();
        const trueValues = ['true', '1', 'yes'];
        const falseValues = ['false', '0', 'no', ''];
        if (trueValues.includes(normalized)) return true;
        if (falseValues.includes(normalized)) return false;
        throw new Error(
            `Configuration ${key} must be a valid boolean (true/false, 1/0, yes/no), got: ${value}`,
        );
    }

    /**
     * Generic configuration getter with support for:
     * - required or optional
     * - default values
     * - type conversion (string, number, boolean)
     * - trim & normalize
     */
    getConfig<T extends 'string' | 'number' | 'boolean'>(
        configService: ConfigService,
        key: string,
        options?: {
            type?: T;
            trim?: boolean;
            normalize?: boolean;
            optional?: boolean;
            defaultValue?: T extends 'number' ? number : T extends 'boolean' ? boolean : string;
        },
    ): T extends 'number' ? number : T extends 'boolean' ? boolean : string | undefined {
        const {
            type,
            trim = true,
            normalize = false,
            optional = false,
            defaultValue,
        } = options || {};

        const rawValue = configService.get<string>(key);

        if (rawValue === undefined || rawValue === null || rawValue === '') {
            if (optional) return defaultValue as any;
            throw new Error(`Missing required configuration: ${key}`);
        }

        const value = trim ? rawValue.trim() : rawValue;

        if (type === 'number') return this.parseNumber(value, key) as any;
        if (type === 'boolean') return this.parseBoolean(value, key) as any;
        if (normalize) return value.toLowerCase() as any;

        return value as any;
    }
}

const DEFAULT_COLORS = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'];

@Injectable()
export class FilesUtils {
    /**
     * Sanitizes a filename by replacing spaces with underscores and removing special characters.
     * Keeps only alphanumeric characters, dots, hyphens, and underscores.
     */
    sanitizeFilename = (filename: string): string =>
        filename.replaceAll(/\s+/g, '_').replaceAll(/[^\w.-]/g, '');

    /**
     * Generates a sanitized object name for storage by combining a UUID with the original filename.
     */
    generateObjectName = (uuid: string, originalFilename: string): string =>
        `${uuid}-${this.sanitizeFilename(originalFilename)}`;

    /**
     * Returns a random color from a provided list of color values.
     * - Randomly selects and returns one color from the array.
     */
    static getRandomColor(colors: string[] = DEFAULT_COLORS): string {
        if (colors.length === 0) throw new Error('Colors array cannot be empty');

        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return colors[array[0] % colors.length];
    }

    /**
     * Determines the type of file based on its MIME type.
     * Checks the MIME type against various substrings to categorize the file.
     * Returns the appropriate file type from the FileType enum based on the MIME type.
     * If no specific type is identified, returns FileType.OTHER.
     */
    determineFileType = (mimeType: string): FileTypeEnum => {
        if (mimeType.includes('audio')) return FileTypeEnum.AUDIO;
        if (mimeType.includes('video')) return FileTypeEnum.VIDEO;
        if (mimeType.includes('image')) return FileTypeEnum.IMAGE;
        if (mimeType.includes('pdf')) return FileTypeEnum.PDF;
        if (mimeType.includes('msword') || mimeType.includes('wordprocessingml'))
            return FileTypeEnum.DOCUMENT;

        return FileTypeEnum.OTHER;
    };
}

@Injectable()
export class AuthUtils {
    /**
     * Generates an SHA-256 hash of a given token.
     * Returns the hexadecimal SHA-256 digest, suitable for secure token storage or comparison.
     */
    hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

    /**
     * Generates a cryptographically secure random refresh token.
     * - Returns a high-entropy token suitable for authentication and session renewal mechanisms.
     */
    generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

    /**
     * Parses the user agent string to extract and format device information.
     * Returns a string combining the browser, operating system, and device type (Mobile, Tablet, or Desktop).
     * If the user agent is not provided, returns "Unknown device".
     */
    parseDeviceName(userAgent?: string): string {
        if (!userAgent) return 'Unknown device';

        const parser = new (UAParser as any)(userAgent);
        const result = parser.getResult();

        const browser = result.browser.name;
        const os = result.os.name;

        let deviceType: string;
        if (result.device.type === DeviceTypeEnum.MOBILE) deviceType = 'Mobile';
        else if (result.device.type === DeviceTypeEnum.TABLET) deviceType = 'Tablet';
        else deviceType = 'Desktop';

        return [browser, os, deviceType].filter(Boolean).join(' · ');
    }
}

type PeriodDates = { startDate: Date; previousStartDate: Date; endDate: Date };

@Injectable()
export class OtherUtils {
    constructor(private readonly errorHandler: ErrorHandlerService) {}

    /** Capitalizes the first letter of a word. */
    changeFirstLetterToUpperCase = (word: string): string =>
        word.charAt(0).toUpperCase() + word.slice(1);

    /**
     * Handles the phone number logic.
     * Parses the provided phone number and returns the country, the phone prefix and phone number without the prefix.
     * Throws an error if the phone number is invalid.
     */
    validateAndParsePhone(providedPhoneNumber: string) {
        const phoneNumber = parsePhoneNumberFromString(providedPhoneNumber.trim());

        if (!phoneNumber?.isValid()) throw new BadRequestException('Invalid phone number');

        return {
            country: phoneNumber?.country?.toString(),
            prefix: phoneNumber.countryCallingCode,
            phone: phoneNumber.nationalNumber,
        };
    }

    /** Rounds a number to 2 decimal places */
    r2 = (n: number): number => Math.round(n * 100) / 100;

    /** Generates a random number string of specified length. */
    generateNumber(length: number) {
        if (length <= 0) return '';

        let number = '';
        for (let i = 0; i < length; i++) {
            number += crypto.randomInt(0, 10).toString();
        }
        return number;
    }

    /**
     * Validates that a given value's state matches or differs from an expected value
     * based on the specified existence check mode.
     * Throws a forbidden error if the validation fails or the mode is invalid.
     */
    assertState(
        actualValue: string,
        expectedValue: string,
        mode: ExistenceCheckModeEnum,
        context?: {
            label?: string;
            entityName?: string;
        },
    ) {
        const label = context?.label ?? 'value';
        const entity = context?.entityName ? ` of ${context.entityName}` : '';

        switch (mode) {
            case ExistenceCheckModeEnum.MUST_EXIST:
                if (actualValue !== expectedValue)
                    this.errorHandler.forbidden(
                        `Invalid ${label}${entity}: expected ${expectedValue}, got ${actualValue}`,
                        `Forbidden: ${label}${entity} must match the expected value`,
                    );
                break;

            case ExistenceCheckModeEnum.MUST_NOT_EXIST:
                if (actualValue === expectedValue)
                    this.errorHandler.forbidden(
                        `${label}${entity} must not be equal to ${expectedValue}`,
                        `Forbidden: ${label}${entity} cannot have this value`,
                    );
                break;

            default:
                this.errorHandler.forbidden(
                    `Unknown ExistenceCheckMode`,
                    `Unknown ExistenceCheckMode`,
                );
        }
    }

    /**
     * Resolves start date, previous period start date, and end date for the specified usage period.
     * Sets the end date to the current date, calculates the start date by subtracting the period duration,
     * computes the previous period start date by subtracting the same duration from the current start date, and returns an object containing all three dates.
     */
    resolvePeriodDates(period: UsagePeriod): PeriodDates {
        const now = new Date();
        const subtract: Record<UsagePeriod, () => Date> = {
            [UsagePeriod.ONE_DAY]: () => subDays(now, 1),
            [UsagePeriod.ONE_WEEK]: () => subWeeks(now, 1),
            [UsagePeriod.ONE_MONTH]: () => subMonths(now, 1),
            [UsagePeriod.ONE_YEAR]: () => subYears(now, 1),
        };

        const startDate = subtract[period]();
        const duration = now.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - duration);

        return { startDate, previousStartDate, endDate: now };
    }

    /**
     * Compiles and renders an email template using Handlebars.
     * Reads the template file from the specified path and applies the provided data.
     */
    buildEmailTemplate = (...args: any[]) => {
        const templatePath = path.join(__dirname, args[0]);
        const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'));

        const data = args[1];

        const safeData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
                key,
                typeof value === 'string'
                    ? sanitizeHtml(value, {
                          allowedTags: [
                              'b',
                              'strong',
                              'i',
                              'em',
                              'br',
                              'p',
                              'ul',
                              'ol',
                              'li',
                              'a',
                              'span',
                          ],
                          allowedAttributes: { a: ['href'], span: ['style'] },
                          allowedSchemes: ['https'],
                      })
                    : value,
            ]),
        );

        return template(safeData);
    };

    /**
     * Formats criteria object into a readable string representation.
     * Converts key-value pairs into "key: value" format separated by commas.
     */
    formatCriteria = (criteria: Record<string, any>) =>
        Object.entries(criteria)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

    /**
     * Checks if a given date is today or in the future.
     * Normalizes both the input date and today's date to midnight for accurate comparison.
     */
    isDateTodayOrFuture(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= today;
    }

    /**
     * Validates if the end date is on or after the start date.
     * Returns `true` if the end date is valid, otherwise `false`.
     */
    isEndDateValid = (startDate: Date, endDate: Date): boolean =>
        new Date(endDate) >= new Date(startDate);

    /**
     * Validates the start and end dates for advertisements.
     * Ensures the start date is today or in the future, and the end date is on or after the start date.
     * Throws a bad request error if any validation fails, listing all encountered errors.
     */
    validateAdsDates(startDate: Date, endDate: Date): void {
        const errors: string[] = [];

        if (!this.isDateTodayOrFuture(startDate))
            errors.push('Start date must be today or a future date');

        if (!this.isEndDateValid(startDate, endDate))
            errors.push('End date must be equal to or after start date');

        if (errors.length > 0)
            this.errorHandler.badRequest(`Date validation failed, ${errors}`, `${errors}`);
    }

    clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));

    lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    /**
     * Paginates an array of results from cache, ensuring the output includes the data,
     * total count, current page, and items per page (limit).
     * Validates input and adjusts page/limit to defaults if invalid.
     * Returns a paginated result object.
     */
    paginateResultsFromCache(results: any[], total: number, page: number, limit: number): object {
        if (!results || results.length === 0) return { data: [], total: 0, page: 0, limit };

        if (!Array.isArray(results)) this.errorHandler.fail('Expected an array');
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        return {
            data: results,
            total: total,
            page: page,
            limit: limit,
        };
    }
}

@Global()
@Injectable()
export class GlobalUtils {
    readonly config: ConfigUtils;
    readonly files: FilesUtils;
    readonly auth: AuthUtils;
    readonly others: OtherUtils;

    constructor(
        configUtils: ConfigUtils,
        filesUtils: FilesUtils,
        authUtils: AuthUtils,
        otherUtils: OtherUtils,
    ) {
        this.config = configUtils;
        this.files = filesUtils;
        this.auth = authUtils;
        this.others = otherUtils;
    }
}
