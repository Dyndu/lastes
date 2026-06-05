import * as indexExports from './index';
import {
    ExistenceCheckModeEnum,
    FileTypeEnum,
    DeviceTypeEnum,
    FileUsageEnum,
    SocketEventEnum,
    GuideStatusEnum,
    NotificationSubjectTypeEnum,
    AdsTypeEnum,
    AdsStatusEnum,
    UserStatusEnum,
    AdsFormatEnum,
    NewsletterChannelEnum,
    NewsletterStatusEnum,
    NewsletterSendModeEnum,
    NewsletterAudienceEnum,
    SubscriptionPeriodEnum,
    CouponTypeEnum,
    SConStatusEnum,
    ModuleTypeEnum,
    ModuleMethodEnum,
    GuideReactionEnum,
    PropertyDetailsTypeEnum,
    SMetricsLimitEnum,
    AcquisitionMethodEnum,
    AcquisitionLoanTypeEnum,
    ModuleLabelEnum,
    BAnalysisTypeEnum,
    CalculationMethodEnum,
    RoomDefaultSectionEnum,
    DtiOtherIncomeLabelsEnum,
    DtiOtherDebtsLabelsEnum,
    CardTypeEnum,
    MCalculatorTypeEnum,
    CreditScoreEnum,
    ExtraPaymentFrequencyEnum,
    UsagePeriod,
    SubscriptionStatusEnum,
    InvoiceStatusEnum,
    IncomeCategoryEnum,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ExistenceCheckModeEnum', ExistenceCheckModeEnum],
        ['FileTypeEnum', FileTypeEnum],
        ['DeviceTypeEnum', DeviceTypeEnum],
        ['FileUsageEnum', FileUsageEnum],
        ['SocketEventEnum', SocketEventEnum],
        ['GuideStatusEnum', GuideStatusEnum],
        ['NotificationSubjectTypeEnum', NotificationSubjectTypeEnum],
        ['AdsTypeEnum', AdsTypeEnum],
        ['AdsStatusEnum', AdsStatusEnum],
        ['UserStatusEnum', UserStatusEnum],
        ['AdsFormatEnum', AdsFormatEnum],
        ['NewsletterChannelEnum', NewsletterChannelEnum],
        ['NewsletterStatusEnum', NewsletterStatusEnum],
        ['NewsletterSendModeEnum', NewsletterSendModeEnum],
        ['NewsletterAudienceEnum', NewsletterAudienceEnum],
        ['SubscriptionPeriodEnum', SubscriptionPeriodEnum],
        ['CouponTypeEnum', CouponTypeEnum],
        ['SConStatusEnum', SConStatusEnum],
        ['ModuleTypeEnum', ModuleTypeEnum],
        ['ModuleMethodEnum', ModuleMethodEnum],
        ['GuideReactionEnum', GuideReactionEnum],
        ['PropertyDetailsTypeEnum', PropertyDetailsTypeEnum],
        ['SMetricsLimitEnum', SMetricsLimitEnum],
        ['AcquisitionMethodEnum', AcquisitionMethodEnum],
        ['AcquisitionLoanTypeEnum', AcquisitionLoanTypeEnum],
        ['ModuleLabelEnum', ModuleLabelEnum],
        ['BAnalysisTypeEnum', BAnalysisTypeEnum],
        ['CalculationMethodEnum', CalculationMethodEnum],
        ['RoomDefaultSectionEnum', RoomDefaultSectionEnum],
        ['DtiOtherIncomeLabelsEnum', DtiOtherIncomeLabelsEnum],
        ['DtiOtherDebtsLabelsEnum', DtiOtherDebtsLabelsEnum],
        ['CardTypeEnum', CardTypeEnum],
        ['MCalculatorTypeEnum', MCalculatorTypeEnum],
        ['CreditScoreEnum', CreditScoreEnum],
        ['ExtraPaymentFrequencyEnum', ExtraPaymentFrequencyEnum],
        ['UsagePeriod', UsagePeriod],
        ['SubscriptionStatusEnum', SubscriptionStatusEnum],
        ['InvoiceStatusEnum', InvoiceStatusEnum],
        ['IncomeCategoryEnum', IncomeCategoryEnum],
    ] as const;

    it.each(expectedExports)('should re-export enums %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
