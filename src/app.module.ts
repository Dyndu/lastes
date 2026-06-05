import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingInterceptor } from './common/logger/logger.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './libs/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigifyModule } from '@itgorillaz/configify';
import { UtilsModule } from './utils/utils.module';
import { ResponseModule } from './common/response';
import { RolesModule } from './core/roles/roles.module';
import { MinioModule } from './libs/storage-driver/minio/minio.module';
import { AwsModule } from './libs/storage-driver/aws/aws.module';
import { StorageDriverModule } from './libs/storage-driver/storage-driver.module';
import { PasswordHasherModule } from './helpers/password-hasher/password-hasher.module';
import { EncryptionModule } from './helpers/encryption/encryption.module';
import { UsersModule } from './core/users/users.module';
import { UserSessionModule } from './core/user-session/user-session.module';
import { GuardModule, PermissionsGuard, SubscriptionGuard } from './common/guard';
import { MailerModule } from './libs/mailer/mailer.module';
import { FilesModule } from './core/files/files.module';
import { PermissionsModule } from './core/permissions/permissions.module';
import { GroupsModule } from './core/groups/groups.module';
import { SocketModule } from './helpers/socket/socket.module';
import { CategoriesModule } from './core/categories/categories.module';
import { CacheModule } from './helpers/cache/cache.module';
import { GuidesModule } from './core/guides/guides.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { AdsModule } from './core/ads/ads.module';
import { MediasModule } from './core/medias/medias.module';
import { NewslettersModule } from './core/newsletters/newsletters.module';
import { CCodesModule } from './core/c-codes/c-codes.module';
import { SCodesModule } from './core/s-codes/s-codes.module';
import { SupportsModule } from './core/supports/supports.module';
import { DatasetsModule } from './core/datasets/datasets.module';
import { ModulesModule } from './core/modules/modules.module';
import { PropertiesModule } from './core/properties/properties.module';
import { PSettingsModule } from './core/p-settings/p-settings.module';
import { RentalModule } from './helpers/rentalcastcash/rental.module';
import { ABuilderModule } from './core/a-builder/a-builder.module';
import { AnalysisModule } from './core/analysis/analysis.module';
import { RAnalysisModule } from './core/r-analysis/r-analysis.module';
import { FFlipModule } from './core/fix-flip/f-flip.module';
import { QueueModule } from './helpers/bull/bull.module';
import { BAnalysisModule } from './core/b-analysis/b-analysis.module';
import { RCalculatorModule } from './core/r-calculator/r-calculator.module';
import { CFinancingModule } from './core/creative-financing/c-financing.module';
import { DtiCalculatorModule } from './core/dti-calculator/dti-calculator.module';
import { MCalculatorModule } from './core/m-calculator/m-calculator.module';
import { WholesaleModule } from './core/wholesale/wholesale.module';
import { IStrategyModule } from './core/i-strategy/i-strategy.module';
import { BrAnalyzerModule } from './core/br-analyzer/br-analyzer.module';
import { SubscriptionModule } from './core/subscriptions/subscription.module';
import { StripeModule } from './libs/stripe/stripe.module';
import { BillingsModule } from './core/billings/billings.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
    imports: [
        DatabaseModule,
        ConfigifyModule.forRootAsync({}),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                level: 'info',

                transport:
                    process.env.NODE_ENV === 'production'
                        ? undefined
                        : {
                              target: 'pino-pretty',
                              options: {
                                  singleLine: true,
                              },
                          },
            },
        }),
        QueueModule,
        ResponseModule,
        SocketModule,
        UtilsModule,
        CacheModule,
        AwsModule,
        MinioModule,
        StorageDriverModule,
        PasswordHasherModule,
        EncryptionModule,
        MailerModule,
        GuardModule,
        RolesModule,
        UserSessionModule,
        UsersModule,
        FilesModule,
        PermissionsModule,
        GroupsModule,
        CategoriesModule,
        GuidesModule,
        NotificationsModule,
        AdsModule,
        MediasModule,
        NewslettersModule,
        CCodesModule,
        SCodesModule,
        SupportsModule,
        DatasetsModule,
        ModulesModule,
        PropertiesModule,
        PSettingsModule,
        RentalModule,
        AnalysisModule,
        RAnalysisModule,
        ABuilderModule,
        FFlipModule,
        BAnalysisModule,
        RCalculatorModule,
        CFinancingModule,
        DtiCalculatorModule,
        MCalculatorModule,
        WholesaleModule,
        IStrategyModule,
        BrAnalyzerModule,
        SubscriptionModule,
        StripeModule,
        BillingsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
        {
            provide: APP_GUARD,
            useClass: SubscriptionGuard,
        },
    ],
})
export class AppModule {}
