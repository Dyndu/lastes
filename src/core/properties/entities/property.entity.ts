import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('properties')
export class PropertyEntity extends AbstractEntity<PropertyEntity> {
    @Column({ nullable: false })
    rentCastId: string;

    @Column({ nullable: false })
    formattedAddress: string;

    @Column({ nullable: false })
    addressLine1: string;

    @Column({ nullable: true })
    addressLine2?: string;

    @Column({ nullable: false })
    city: string;

    @Column({ nullable: false, length: 2 })
    state: string;

    @Column({ nullable: false, length: 2 })
    stateFips: string;

    @Column({ nullable: false })
    zipCode: string;

    @Column({ nullable: false })
    county: string;

    @Column({ nullable: false })
    countyFips: string;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    @Column({ nullable: true })
    propertyType?: string;

    @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
    bedrooms?: number;

    @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
    bathrooms?: number;

    @Column({ type: 'int', nullable: true })
    squareFootage?: number;

    @Column({ type: 'int', nullable: true })
    lotSize?: number;

    @Column({ type: 'int', nullable: true })
    yearBuilt?: number;

    @ManyToOne(() => UserEntity, { eager: false })
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;
}
