import { Relationship } from "../entities/nominee.entity";
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
    nominees: Array<{
        relationship: Relationship;
        dob: Date;
    }>
}
