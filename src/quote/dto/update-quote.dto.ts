import { PartialType } from '@nestjs/mapped-types';

export class UpdateQuoteDto {
    sumInsured: number;
    selectedProductId: number;
    tenure: number;
    riders: Array<{
        riderId: number;
        name: string;
        price: number;
    }>
}
