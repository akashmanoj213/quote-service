import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { InsurableParty } from "./insurable-party.entity";
import { Rider } from "./rider.entity";

export enum InsuranceType {
    FAMILY = "family",
    SELF = "self"
}

@Entity()
export class Quote {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column({
        nullable: true
    })
    sumInsured?: number;
    @Column({
        type: "enum",
        enum: InsuranceType,
        default: InsuranceType.SELF
    })
    type: InsuranceType;
    @Column({
        default: false
    })
    preExistingDiseases?: boolean;
    @Column({
        nullable: true
    })
    tenure?: number;
    @Column({
        nullable: true
    })
    total?: number;
    @Column({
        nullable: true
    })
    selectedProductId?: number;
    @Column()
    numberOfChildren: number;
    @Column()
    numberOfAdults: number;
    @CreateDateColumn()
    createdAt?: Date;
    @UpdateDateColumn()
    updatedAt?: Date;
    @OneToOne(type => User, user => user.quote, { cascade: true })
    @JoinColumn()
    user: User
    @OneToMany(type => InsurableParty, insruableParty => insruableParty.quote, { cascade: true })
    insurableParties: InsurableParty[]
    @OneToMany(type => Rider, rider => rider.quote, { cascade: true })
    riders?: Rider[]
}
