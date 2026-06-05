import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderEntity, ADetailsEntity } from '../entities';
import { AcquisitionLoanTypeEnum, AcquisitionMethodEnum } from '../../../common/enum';
import { ABuilderService } from './a-builder.service';
import { ADetailsDto } from '../dto';

@Injectable()
export class ADetailsService {
    /**
     * Service responsible for handling acquisition details operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates the provided AcquisitionDetailsDto for required fields based on the acquisition method and itemization.
     * Adds error messages to the errors object if itemized details are missing when hasItems is true,
     * or if down payment, loanInterest, loanLength, or loanType are missing for the FINANCED method.
     */
    validateAcquisitionDetails(aDetails: ADetailsDto) {
        const errors: Record<string, string> = {};

        if (aDetails.hasItems && !aDetails.item)
            errors['item'] = 'Itemized details are required for acquisition details';

        if (!aDetails.hasItems && aDetails.acquisitionCoast == null)
            errors['acquisitionCoast'] = 'Acquisition cost is required when items are not provided';

        if (aDetails.hasItems && aDetails.acquisitionCoast != null)
            errors['acquisitionCoast'] =
                'Acquisition cost must not be provided when items are used — it is calculated automatically';

        if (
            aDetails.method === AcquisitionMethodEnum.FINANCED &&
            (!aDetails.downPayment ||
                !aDetails.loanInterest ||
                !aDetails.loanLength ||
                !aDetails.loanType ||
                !aDetails.points)
        )
            errors['downPayment'] =
                errors['loanInterest'] =
                errors['loanLength'] =
                errors['loanType'] =
                errors['points'] =
                    'These fields are required for financed method';

        this.aBuilderService.errorHandler.validation(errors);
    }

    calculateCashNeededToClose = (closingCostFees?: number, downPayment?: number) =>
        (closingCostFees ?? 0) + (downPayment ?? 0);

    /**
     * Creates and returns a new ADetailsEntity populated with the required fields (method, purchasePrice,
     * sellerConcessions, credits, acquisitionCoast) and optional fields (down payment, loanInterest,
     * loanLength, loanType).
     */
    buildADetailsEntity(
        required: {
            method: AcquisitionMethodEnum;
            purchasePrice: number;
            sellerConcessions: number;
            credits: number;
            acquisitionCoast: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
            downPayment?: number;
            loanInterest?: number;
            loanLength?: number;
            points?: number;
            loanType?: AcquisitionLoanTypeEnum;
            monthlyIncome?: number;
            earnestMoneyDeposit?: number;
            closingCostFees?: number;
            holdingPeriod?: number;
            othersFees?: number;
        },
    ): ADetailsEntity {
        const result = new ADetailsEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Updates acquisition details of an existing ADetailsEntity by selectively applying only the fields
     * that are present in the provided partial update object. Returns early with a message if no valid
     * updates are supplied, otherwise persists the changes to the repository.
     */
    async updateADetails(
        aDetails: ADetailsEntity,
        pUpdates?: Partial<{
            method: AcquisitionMethodEnum;
            purchasePrice: number;
            sellerConcessions: number;
            credits: number;
            acquisitionCoast: number;
            downPayment: number;
            loanInterest: number;
            points: number;
            total: number;
            loanLength: number;
            loanType?: AcquisitionLoanTypeEnum;
            monthlyIncome?: number;
            earnestMoneyDeposit?: number;
            closingCostFees?: number;
            holdingPeriod?: number;
            othersFees?: number;
        }>,
    ) {
        if (!pUpdates || Object.keys(pUpdates).length === 0)
            return {
                message: 'No updates provided for acquisition details',
            };

        const otherFields = [
            'method',
            'purchasePrice',
            'sellerConcessions',
            'credits',
            'acquisitionCoast',
            'downPayment',
            'points',
            'loanInterest',
            'loanLength',
            'loanType',
            'monthlyIncome',
            'earnestMoneyDeposit',
            'closingCostFees',
            'holdingPeriod',
            'othersFees',
        ] as const;

        const updatePayload: Partial<ADetailsEntity> = {};

        otherFields.forEach((field) => {
            if (pUpdates[field] !== undefined) updatePayload[field] = pUpdates[field] as any;
        });

        return await this.aBuilderService.aDetailsRepository.update(
            { id: aDetails.id },
            updatePayload,
        );
    }

    /**
     * Calculates the loan points cost based on acquisition details.
     * Derives the financed amount from purchase price and down payment,
     * then applies the points percentage to compute the total cost.
     */
    calculateLoanPointsCost(data: {
        purchasePrice: number;
        downPayment?: number;
        points?: number;
    }): number {
        const { purchasePrice, downPayment = 0, points = 0 } = data;
        const financedAmount = purchasePrice - downPayment;
        return (financedAmount * points) / 100;
    }
}
