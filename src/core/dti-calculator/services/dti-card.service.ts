import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { DtiCalculatorService } from './dti-calculator.service';
import { CardTypeEnum } from '../../../common/enum';
import { DtiCalculatorEntity, DtiCardEntity, DtiEIncomeEntity } from '../entities';
import { UpdateDtiCardDto } from '../dto';

@Injectable()
export class DtiCardService {
    /**
     * Service responsible for handling dti calculator credit cards operations
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Generates a deterministic fingerprint for a PAN value.
     * Normalizes input by stripping non-digit characters and applies HMAC-SHA256 hashing with a secret key.
     */
    fingerprint = (pan: string, secret: string): string =>
        crypto.createHmac('sha256', secret).update(pan.replaceAll(/\D/g, '')).digest('hex');

    /**
     * Validates a card number using the Luhn algorithm.
     * Normalizes input, enforces length constraints, and verifies checksum integrity.
     */
    isValidCard(pan: string): boolean {
        const digits = pan.replaceAll(/\D/g, '').split('').reverse().map(Number);
        if (digits.length < 13 || digits.length > 19) return false;

        const sum = digits.reduce((acc, digit, i) => {
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            return acc + digit;
        }, 0);
        return sum % 10 === 0;
    }

    /**
     * Validates a card expiry date.
     * Ensures format compliance, checks month bounds, normalizes year,
     * and verifies that the expiry date is in the future.
     */
    isValidExpiry(expiry: string): boolean {
        const match = new RegExp(/^(\d{2})\/(\d{2}|\d{4})$/).exec(expiry);
        if (!match) return false;

        const month = Number.parseInt(match[1], 10);
        if (month < 1 || month > 12) return false;

        const year =
            match[2].length === 2
                ? 2000 + Number.parseInt(match[2], 10)
                : Number.parseInt(match[2], 10);

        const expDate = new Date(year, month, 0);
        return expDate > new Date();
    }

    /**
     * Detects the card brand based on PAN patterns.
     * Normalizes input and resolves the card type using prefix rules,
     * raising an error if the card type cannot be identified.
     */
    detectBrand(pan: string) {
        const n = pan.replaceAll(/\D/g, '');
        if (n.startsWith('4')) return CardTypeEnum.VISA;
        else if (/^5[1-5]|^2[2-7]/.test(n)) return CardTypeEnum.MASTERCARD;
        else if (/^3[47]/.test(n)) return CardTypeEnum.AMEX;
        else if (n.startsWith('6')) return CardTypeEnum.DISCOVER;
        else
            this.dtiCalculatorService.errorHandler.badRequest(
                `Unknown card`,
                `This card type is unknow`,
            );
    }

    /**
     * Prepares and validates card data for downstream processing.
     * Normalizes input, enforces expiry and card validity checks,
     * and returns masked details with detected brand and generated fingerprint.
     */
    prepareCardData(pan: string, expiry: string, secret: string) {
        const cleaned = pan.replaceAll(/\D/g, '');

        if (!this.isValidExpiry(expiry))
            this.dtiCalculatorService.errorHandler.badRequest(
                `Card expiry ${expiry} is invalid or expired`,
                `Expiry card`,
            );

        if (!this.isValidCard(cleaned))
            this.dtiCalculatorService.errorHandler.badRequest(`Card is not valid`, `Invalid card`);

        return {
            last4: cleaned.slice(-4),
            brand: this.detectBrand(cleaned),
            fingerprint: this.fingerprint(cleaned, secret),
            expiry,
        };
    }

    /**
     * Builds a DTI card entity from the provided data.
     * Maps required fields into a new entity instance for persistence or further processing.
     */
    buildDtiCardEntity(required: {
        last4: string;
        brand: CardTypeEnum;
        fingerprint: string;
        expiry: string;
        amount: number;
        calculator: DtiCalculatorEntity;
    }) {
        const result = new DtiCardEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Retrieves a card entity based on the provided criteria.
     * Logs the lookup context, fetches active data with optional relations,
     * and raises a not found error if no matching record exists.
     */
    async retrieveCardByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<DtiCardEntity> {
        const entries = this.dtiCalculatorService.otherUtils.formatCriteria(criteria);
        this.dtiCalculatorService.logger.info(`Find a card details by ${entries}`);

        const isDataExist = await this.dtiCalculatorService.dtiCardRepo.findActiveOne(
            this.dtiCalculatorService.dtiCardRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.dtiCalculatorService.errorHandler.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isDataExist;
    }

    /**
     * Creates a new DTI card entity.
     * Prepares and validates card data, enforces uniqueness by fingerprint within the calculator scope,
     * and persists the card with associated metadata and amount.
     */
    async createDtiCard(
        calculator: DtiCalculatorEntity,
        pan: string,
        expiry: string,
        amount: number,
    ): Promise<DtiCardEntity> {
        const secret = this.dtiCalculatorService.cardSecret;
        const data = this.prepareCardData(pan, expiry, secret);

        const existing = await this.dtiCalculatorService.dtiCardRepo.findOne({
            where: { fingerprint: data.fingerprint, calculator: { id: calculator.id } },
        });

        if (existing)
            this.dtiCalculatorService.errorHandler.conflict(
                `Card fingerprint ${data.fingerprint} already exists on calculator ${calculator.id}`,
                `This card information already exists on calculator`,
            );

        return await this.dtiCalculatorService.dtiCardRepo.create(
            this.buildDtiCardEntity({
                expiry: data.expiry,
                last4: data.last4,
                fingerprint: data.fingerprint,
                brand: data.brand,
                amount,
                calculator,
            }),
        );
    }

    /**
     * Updates an existing card entity.
     * Validates input payload, normalizes string fields, applies partial updates,
     * and persists changes, returning early if no updates are provided.
     */
    async updateCardEntity(
        card: DtiCardEntity,
        itemized?: Partial<{
            pan: string;
            expiry: string;
            amount: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for card details',
            };

        const otherFields = ['amount'] as const;
        const stringField = ['pan', 'expiry'] as const;

        const updatePayload: Partial<DtiEIncomeEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.dtiCalculatorService.dtiCardRepo.update({ id: card.id }, updatePayload);
    }

    /**
     * Updates a credit card entity based on the provided ID and DTO data.
     * Retrieves the existing card by criteria, then applies updates to the amount field.
     * Persists the updated entity through the card update service.
     */
    async updateCard(id: string, dto: UpdateDtiCardDto) {
        const card = await this.retrieveCardByCriteria({ id });

        return await this.updateCardEntity(card, {
            amount: dto.amount,
        });
    }

    /**
     * Deletes an existing card entity by id.
     * Retrieves the target entity to ensure it exists before deletion,
     * then removes it from the repository using its identifier.
     */
    async deleteCardEntity(id: string) {
        const isDateExist = await this.retrieveCardByCriteria({ id });
        await this.dtiCalculatorService.dtiCardRepo.delete({ id: isDateExist.id });
    }
}
