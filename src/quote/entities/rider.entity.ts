import { PrimaryGeneratedColumn, Column, ManyToOne, Entity, CreateDateColumn } from "typeorm";
import { Quote } from "./quote.entity";

@Entity()
export class Rider {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column()
    riderId: number;
    @Column()
    name: string;
    @Column()
    price: number;
    @CreateDateColumn()
    createdAt?: Date;
    @ManyToOne(type=> Quote, quote => quote.nominees)
    quote?: Quote;
}