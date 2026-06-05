import { Global, Injectable } from '@nestjs/common';
import { SingletonStatsInterface } from '../../interface';
import { DeepPartial } from 'typeorm';

@Global()
@Injectable()
export abstract class BaseStatsService<
    S extends string,
    T extends SingletonStatsInterface & { [K in S]: number },
> {
    protected constructor(
        protected readonly repo: {
            findOne(options: any): Promise<T | null>;
            build(data: DeepPartial<T>): T;
            create(entity: T): Promise<T>;
            update(where: any, data: Partial<T>): Promise<T>;
        },
    ) {}

    async getSingleton(): Promise<T> {
        let stats = await this.repo.findOne({
            where: { singleton: 1 },
        });

        if (!stats) {
            const data: DeepPartial<T> = {
                singleton: 1,
                total: 0,
            } as DeepPartial<T>;

            const entity = this.repo.build(data);
            stats = await this.repo.create(entity);
        }

        return stats;
    }

    protected async persist(stats: T, fields?: S[]): Promise<T> {
        const payload: Partial<T> = fields
            ? (Object.fromEntries(fields.map((f) => [f, stats[f]])) as unknown as Partial<T>)
            : stats;

        return this.repo.update({ singleton: 1 }, payload);
    }

    protected increment<K extends S>(stats: T, key: K, delta: number) {
        (stats as any)[key] += delta;
    }

    async onCreate(status: S): Promise<T> {
        const stats = await this.getSingleton();

        stats.total += 1;
        this.increment(stats, status, 1);

        return this.persist(stats);
    }

    async onDelete(status: S): Promise<T> {
        const stats = await this.getSingleton();

        stats.total = Math.max(0, stats.total - 1);
        this.increment(stats, status, -1);

        return this.persist(stats);
    }

    async onStatusChange(from: S, to?: S): Promise<T> {
        if (!to || to === from) return this.getSingleton();

        const stats = await this.getSingleton();

        this.increment(stats, from, -1);
        this.increment(stats, to, 1);

        return this.persist(stats, [from, to]);
    }
}
