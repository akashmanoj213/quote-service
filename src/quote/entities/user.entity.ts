import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Quote } from "./quote.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column({
        nullable: true
    })
    firstName: string;
    @Column({
        nullable: true
    })
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