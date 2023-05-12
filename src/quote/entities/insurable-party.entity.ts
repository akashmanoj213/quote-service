import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Quote } from "./quote.entity";

export enum Relationship {
    SELF = "self",
    SPOUSE = "spouse",
    CHILD = "child",
    FATHER = "father",
    MOTHER = "mother",
    GRANDFATHER = "grandfather",
    GRANDMOTHER = "grandmother",
    "FATHER-IN-LAW" = "father-in-law",
    "MOTHER-IN-LAW" = "mother-in-law"
}

@Entity()
export class InsurableParty {
    @PrimaryGeneratedColumn()
    id?: number;
    @Column({
        type: "enum",
        enum: Relationship,
        default: Relationship.SELF
    })
    relationship: Relationship;
    @Column({
        type: "date"
    })
    dob: Date;
    @CreateDateColumn()
    createdAt?: Date;
    @ManyToOne(type  => Quote, quote => quote.insurableParties)
    quote?: Quote
}
