import { Relationship } from "../entities/insurable-party.entity";
import { InsuranceType } from "../entities/quote.entity";

export class CreateQuoteDocumentDto {
    id: number;
    sumInsured: number;
    type: InsuranceType;
    preExistingDiseases: boolean;
    tenure: number;
    total: number;
    selectedProductId: number;
    numberOfChildren: number;
    numberOfAdults: number;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        gender: string;
        dob: Date;
        pincode: string;
        mobileNumber: string;
        email: string;
        createdAt: Date;
    };
    nominees: Array<{
        id: number;
        relationship: Relationship;
        dob: Date;
        createdAt: Date;
    }>;
}