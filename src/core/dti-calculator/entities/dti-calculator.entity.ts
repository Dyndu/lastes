import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { DtiPropertyEntity } from './dti-property.entity';
import { DtiEIncomeEntity } from './dti-e-income.entity';
import { DtiOtherDebtsEntity } from './dti-other-debts.entity';
import { DtiCardEntity } from './dti-card.entity';
import { DtiOtherIncomeEntity } from './dti-other-income.entity';

@Entity('dti_calculator')
export class DtiCalculatorEntity extends AbstractEntity<DtiCalculatorEntity> {
    @OneToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;

    @Column({ nullable: true })
    description: string;

    @OneToMany(() => DtiPropertyEntity, (u) => u.calculator, {
        cascade: true,
        eager: false,
    })
    properties: DtiPropertyEntity[];

    @OneToMany(() => DtiEIncomeEntity, (u) => u.calculator, {
        cascade: true,
        eager: false,
    })
    eIncome: DtiEIncomeEntity[];

    @OneToMany(() => DtiOtherIncomeEntity, (u) => u.calculator, {
        cascade: true,
        eager: false,
    })
    oIncome: DtiOtherIncomeEntity[];

    @OneToMany(() => DtiOtherDebtsEntity, (u) => u.calculator, {
        cascade: true,
        eager: false,
    })
    debts: DtiOtherDebtsEntity[];

    @OneToMany(() => DtiCardEntity, (u) => u.calculator, {
        cascade: true,
        eager: false,
    })
    cards: DtiCardEntity[];
}
