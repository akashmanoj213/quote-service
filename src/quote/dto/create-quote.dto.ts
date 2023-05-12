import { Relationship } from "../entities/insurable-party.entity";
import { InsuranceType } from "../entities/quote.entity";

export class CreateQuoteDto {
    firstName: string;
    lastName: string;
    // sumInsured: number;
    type: InsuranceType;
    preExistingDiseases: boolean;
    // tenure: number;
    // total: number;
    gender: string;
    dob: Date;
    pincode: string;
    mobileNumber: string;
    email: string;
    selectedProductId: number;
    numberOfChildren: number;
    numberOfAdults: number;
    insurableParties: Array<{
        relationship: Relationship;
        dob: Date;
    }>
}
