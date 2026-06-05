import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { forwardRef, Inject } from '@nestjs/common';
import { NewslettersService } from './newsletters.service';

@Processor('newsletter')
export class NewsletterProcessor extends WorkerHost {
    constructor(
        @Inject(forwardRef(() => NewslettersService))
        private readonly nlService: NewslettersService,
    ) {
        super();
    }

    /**
     * Processes a scheduled or queued newsletter job, handling sending, cache invalidation, and cleanup.
     * Retrieves the newsletter, ensures a super admin is available, sends the newsletter to the target audience,
     * invalidates related cache, and cancels any pending scheduled jobs for the newsletter.
     */
    async process(job: Job<{ newsletterId: string; usersIds?: string[] }>): Promise<object> {
        const { newsletterId, usersIds } = job.data;

        this.nlService.logger.info(`[BullMQ] Processing job for newsletter: ${newsletterId}`);

        const news = await this.nlService.preNLService.retrieveNewLetterByCriteria({
            id: newsletterId,
        });

        this.nlService.logger.info(
            `[BullMQ] Newsletter found: "${news.label}" | channel: ${news.channel} | audience: ${news.audience}`,
        );

        const sAdmin = await this.nlService.userRepository.findOne({
            where: { role: { label: this.nlService.config.sAdminRole } },
        });

        if (!sAdmin) this.nlService.errorHandler.notFound('Super admin not found — job will retry');

        await this.nlService.preNLService.sendNewsLetter(sAdmin, news, usersIds);
        this.nlService.logger.info(`[BullMQ] Newsletter "${news.label}" sent successfully`);

        await this.nlService.cacheService.deleteKeysByBase('newsletter');
        this.nlService.logger.info(`[BullMQ] Cache invalidated for newsletter`);

        await this.nlService.preNLService.cancelScheduledJob(newsletterId);
        this.nlService.logger.info(`[BullMQ] Job cleaned up for newsletter: ${newsletterId}`);
        return { message: 'Newsletter process executed successfully' };
    }
}
