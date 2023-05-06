import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Quote } from "./quote.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column()
    firstName: string;
    @Column()
    lastName: string;
    @Column()
    gender: string;
    @Column({
        type: "date"
    })
    dob: Date;
    @Column()
    pincode: string;
    @Column()
    mobileNumber: string;
    @Column({
        nullable: true
    })
    email: string;
    @CreateDateColumn()
    createdAt?: Date;
    @OneToOne(type => Quote, quote => quote.user)
    quote?: Quote
}