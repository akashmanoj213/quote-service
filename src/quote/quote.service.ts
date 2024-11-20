import { Injectable } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Relationship } from './entities/insurable-party.entity';
import { PubSubService } from 'src/providers/pub-sub/pub-sub.service';
import { FirestoreService } from 'src/providers/firestore/firestore.service';
import { HttpService } from '@nestjs/axios';
import { ProductRecommendationDto } from './dto/product-recommendation.dto';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';

export type Products = Array<{
  id: number;
  name: string;
  description: string;
  basePrice: number;
  tenures: Array<{
    duration: number;
    price: number;
  }>;
  features: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
  }>;
  riders: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
  }>;
}>;

@Injectable()
export class QuoteService {
  readonly QUOTE_PUB_SUB_TOPIC = 'quote-changes';
  readonly USER_PUB_SUB_TOPIC = 'user-changes';
  readonly QUOTE_COLLECTION = 'quotes';
  readonly PROJECT_ID = 'pruinhlth-nprd-dev-scxlyx-7250';

  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    private pubSubService: PubSubService,
    private firestoreService: FirestoreService,
    private readonly httpService: HttpService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto) {
    const {
      firstName,
      lastName,
      gender,
      dob,
      pincode,
      mobileNumber,
      email,
      type,
      preExistingDiseases,
      selectedProductId,
      numberOfAdults = 1,
      numberOfChildren = 0,
      insurableParties = [],
    } = createQuoteDto;

    const dateOfBirth = DateTime.fromISO(dob);

    if (dateOfBirth.invalid) {
      throw new Error(dateOfBirth.invalid.explanation);
    }

    const user: User = {
      firstName,
      lastName,
      gender,
      dob: dateOfBirth.toSQLDate(),
      pincode,
      mobileNumber,
      email,
    };

    const updateUserEventData = {
      ...user,
    };

    // TO DO: publish an event for creating/updating user from this object

    if (insurableParties.length === 0) {
      insurableParties.push({
        dob: dateOfBirth.toSQLDate(),
        relationship: Relationship.SELF,
      });
    }
    // else case - check if the number of insurableParties === nunmberOfAdults + numberOfChildren

    const quote: Quote = {
      type,
      preExistingDiseases,
      user,
      insurableParties,
      numberOfAdults,
      numberOfChildren,
    };

    await this.quoteRepository.save(quote);

    // Create Quick QUote from PAS partner API
    try {
      const quoteData = {
        basicDetails: [
          {
            multiSetAttribute: null,
            name: 'Proposer Pin Code',
            value: '273413',
          },
          {
            multiSetAttribute: null,
            name: 'Proposer Email ID',
            value: 'girnar@gmail.com',
          },
          {
            multiSetAttribute: null,
            name: 'Plan',
            value: 'PLATINUMV2',
          },
          {
            multiSetAttribute: null,
            name: 'Sub Plan Type',
            value: '6212100003',
          },
          {
            multiSetAttribute: null,
            name: 'Plan Type',
            value: 'FLOATER',
          },
          {
            multiSetAttribute: null,
            name: 'Policy Tenure',
            value: '1Y',
          },
          {
            multiSetAttribute: null,
            name: 'Producer Code',
            value: '5100128',
          },
          {
            multiSetAttribute: null,
            name: 'App_ID',
            value: '',
          },
          {
            multiSetAttribute: null,
            name: 'Source Code',
            value: 'Girnar',
          },
          {
            multiSetAttribute: null,
            name: 'NB Channel',
            value: '20',
          },
          {
            multiSetAttribute: null,
            name: 'Type of Business',
            value: 'NB',
          },
          {
            multiSetAttribute: null,
            name: 'Quote Start Date',
            value: '29/09/2024',
          },
          {
            multiSetAttribute: null,
            name: 'Proposer Annual Income',
            value: '0',
          },
          {
            multiSetAttribute: null,
            name: 'Employee Discount',
            value: 'N',
          },
          {
            multiSetAttribute: null,
            name: 'Applicable Sum Insured',
            value: '500000',
          },
          {
            multiSetAttribute: null,
            name: 'Existing Policy Number',
            value: '',
          },
          {
            multiSetAttribute: null,
            name: 'Previous Policy Expiry Date',
            value: '',
          },
          {
            multiSetAttribute: null,
            name: 'Number of Members',
            value: '3',
          },
          {
            multiSetAttribute: null,
            name: 'Policy Start Date',
            value: '29/09/2024',
          },
          {
            multiSetAttribute: null,
            name: 'Family Size',
            value: 'SE-SP-1C',
          },
          {
            multiSetAttribute: null,
            name: 'Deductible_Amount',
            value: '0',
          },
        ],
        flag: 'C',
        members: [
          {
            memberDetails: [
              {
                multiSetAttribute: null,
                name: 'Annual Gross Income',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Annual Income',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Member Name',
                value: 'A1',
              },
              {
                multiSetAttribute: null,
                name: 'Room Category',
                value: 'XXC',
              },
              {
                multiSetAttribute: null,
                name: 'Occupation',
                value: '915',
              },
              {
                multiSetAttribute: null,
                name: 'Options',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'Applicable SI',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'Designation',
                value: 'NA',
              },
              {
                multiSetAttribute: null,
                name: 'Deductible_Amount',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Applicable Sum Insured',
                value: '500000',
              },
              {
                multiSetAttribute: null,
                name: 'Is Chronic Disease ?',
                value: 'NO',
              },
              {
                multiSetAttribute: null,
                name: 'Zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: null,
                name: 'Opted zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: null,
                name: 'Gender',
                value: 'M',
              },
              {
                multiSetAttribute: null,
                name: 'Date of Birth',
                value: '29/09/1990',
              },
              {
                multiSetAttribute: null,
                name: 'Relationship',
                value: '24',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeFirstName',
                value: 'Nominee',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeLastName',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeContactNumber',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeHomeAddress',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineerelationshipwithProposer',
                value: '24',
              },
            ],
            covers: [
              {
                coverCode: 'WMCP',
                coverName: '',
                coverAttribute: [
                  {
                    name: 'Applicable Sum Insured',
                    value: '62124138',
                  },
                ],
              },
            ],
          },
          {
            memberDetails: [
              {
                multiSetAttribute: null,
                name: 'Annual Gross Income',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Annual Income',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Member Name',
                value: 'A2',
              },
              {
                multiSetAttribute: null,
                name: 'Room Category',
                value: 'XXC',
              },
              {
                multiSetAttribute: null,
                name: 'Occupation',
                value: '915',
              },
              {
                multiSetAttribute: null,
                name: 'Options',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'Applicable SI',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'Designation',
                value: 'NA',
              },
              {
                multiSetAttribute: null,
                name: 'Deductible_Amount',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Applicable Sum Insured',
                value: '500000',
              },
              {
                multiSetAttribute: null,
                name: 'Is Chronic Disease ?',
                value: 'NO',
              },
              {
                multiSetAttribute: null,
                name: 'Zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: null,
                name: 'Opted zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: null,
                name: 'Gender',
                value: 'F',
              },
              {
                multiSetAttribute: null,
                name: 'Date of Birth',
                value: '29/09/1992',
              },
              {
                multiSetAttribute: null,
                name: 'Relationship',
                value: '13',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeFirstName',
                value: 'Nominee',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeLastName',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeContactNumber',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeHomeAddress',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineerelationshipwithProposer',
                value: '13',
              },
            ],
            covers: [
              {
                coverCode: 'WMCP',
                coverName: '',
                coverAttribute: [
                  {
                    name: 'Applicable Sum Insured',
                    value: '62124138',
                  },
                ],
              },
            ],
          },
          {
            memberDetails: [
              {
                multiSetAttribute: null,
                name: 'Annual Gross Income',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Annual Income',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Member Name',
                value: 'A3',
              },
              {
                multiSetAttribute: null,
                name: 'Room Category',
                value: 'XXC',
              },
              {
                multiSetAttribute: null,
                name: 'Occupation',
                value: '915',
              },
              {
                multiSetAttribute: null,
                name: 'Options',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'Applicable SI',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'Designation',
                value: 'NA',
              },
              {
                multiSetAttribute: null,
                name: 'Deductible_Amount',
                value: '0',
              },
              {
                multiSetAttribute: null,
                name: 'Applicable Sum Insured',
                value: '500000',
              },
              {
                multiSetAttribute: null,
                name: 'Is Chronic Disease ?',
                value: 'NO',
              },
              {
                multiSetAttribute: null,
                name: 'Zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: null,
                name: 'Opted zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: null,
                name: 'Gender',
                value: 'F',
              },
              {
                multiSetAttribute: null,
                name: 'Date of Birth',
                value: '29/09/2022',
              },
              {
                multiSetAttribute: null,
                name: 'Relationship',
                value: '19',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeFirstName',
                value: 'Nominee',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeLastName',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeContactNumber',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineeHomeAddress',
                value: '',
              },
              {
                multiSetAttribute: null,
                name: 'NomineerelationshipwithProposer',
                value: '19',
              },
            ],
            covers: [
              {
                coverCode: 'WMCP',
                coverName: '',
                coverAttribute: [
                  {
                    name: 'Applicable Sum Insured',
                    value: '62124138',
                  },
                ],
              },
            ],
          },
        ],
        productCode: '6212',
        quoteNumber: null,
      };

      const { data } = await firstValueFrom(
        this.httpService.post(
          'https://pas-core-453999121690.us-central1.run.app/pas/createQuickQuote',
          quoteData,
        ),
      );
      console.log('Response from PAS createQuickQuote API:', data);
    } catch (error) {
      // Handle errors appropriately, e.g., logging, throwing a custom exception
      console.error('Error calling createQuickQuote PAS API:', error.message);
    }

    //Sync changes to Query database
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);
    //Publish user details for user-service to save changes
    await this.pubSubService.publishMessage(
      this.USER_PUB_SUB_TOPIC,
      updateUserEventData,
    );

    // Mock flow of products being returned by PAS
    const { years: age } = dateOfBirth.diffNow('years');

    const productRecommendationDto: ProductRecommendationDto = {
      selectedProductId,
      gender,
      age: +Math.abs(age).toFixed(),
    };
    const { data: products } = await this.getProducts(productRecommendationDto);
    quote['products'] = products;

    return quote;
  }

  async findAll() {
    return await this.firestoreService.findAll(this.QUOTE_COLLECTION);
  }

  async findOne(quoteId: number) {
    const res = await this.firestoreService.findById(
      this.QUOTE_COLLECTION,
      quoteId,
    );

    if (!res.exists) return {};
    else return res.data;
  }

  async update(quoteId: number, updateQuoteDto: UpdateQuoteDto) {
    const { sumInsured, selectedProductId, riders, tenure } = updateQuoteDto;

    let quote = await this.quoteRepository.findOne({
      where: {
        id: quoteId,
      },
      relations: {
        user: true,
        insurableParties: true,
        riders: true,
      },
    });

    const {
      user: { dob, gender },
    } = quote;

    const dateOfBirth = DateTime.fromISO(dob);
    const { years: age } = dateOfBirth.diffNow('years');

    const productRecommendationDto: ProductRecommendationDto = {
      sumInsured,
      selectedProductId,
      gender,
      age,
    };

    // Mock flow of products being returned by PAS
    const { data: products } = await this.getProducts(productRecommendationDto);

    if (!products.length) {
      throw new Error('No product record found !');
    }

    let totalPrice = selectedProductId ? products[0].basePrice : 0;

    if (riders && riders.length) {
      const { riders: productRiders } = products[0];
      const selectedRiders = riders.map((rider) => rider.riderId);

      productRiders.forEach((rider) => {
        if (selectedRiders.includes(rider.riderId)) {
          totalPrice += rider.price;
        }
      });
    }

    quote = {
      ...quote,
      ...(sumInsured && { sumInsured }),
      ...(selectedProductId && { selectedProductId }),
      ...(riders && { riders }),
      ...(tenure && { tenure }),
      ...(totalPrice && { total: totalPrice }),
    };

    await this.quoteRepository.save(quote);

    // Create Quick QUote from PAS partner API
    try {
      const quoteData = {
        roleCode: 'COPS',
        flag: 'C',
        productCode: '6212',
        policyBranch: '',
        policyTermUnit: 'G',
        policyInceptionDate: '29/09/2024',
        policyStatus: '',
        premiumDepositMode: '',
        premiumFrequency: '',
        proposalNumber: '',
        policyNumber: '',
        policyExpiryDate: '',
        policyTerm: '1',
        baseCurrencyRate: '',
        baseCurrency: '',
        premiumCurrencyRate: '',
        premiumCurrency: '',
        entityType: '',
        basicdetailAttribute: [
          {
            multiSetAttribute: [],
            name: 'Plan',
            value: 'Digital',
          },
          {
            multiSetAttribute: [],
            name: 'Partner Branch Code',
            value: 'RJ009',
          },
          {
            multiSetAttribute: [],
            name: 'Premium Frequency',
            value: 'B',
          },
          {
            multiSetAttribute: [],
            name: 'CKYC Flag',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'PreissuanceOTPdate',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'PreissuanceOTPTime',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'CKYC Number',
            value: '40023734300279',
          },
          {
            multiSetAttribute: [],
            name: 'Politically Exposed Person',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'Hyper verge OPD Status',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'Digi Locker Verified',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'Plan Type',
            value: 'FLOATER',
          },
          {
            multiSetAttribute: [],
            name: 'Sub Plan Type',
            value: 'Digital',
          },
          {
            multiSetAttribute: [],
            name: 'Member Type Code',
            value: 'SE-SP',
          },
          {
            multiSetAttribute: [],
            name: 'Auto Renewal',
            value: '0',
          },
          {
            multiSetAttribute: [],
            name: 'AML Flag',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'CKYC Face Match',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'KYC Transition Id',
            value: 'CP_7ce1c420e4664df29c85aad9cea05354',
          },
          {
            multiSetAttribute: [],
            name: 'Auto-Debit Flag',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'Party Links',
            value: 'I',
          },
          {
            multiSetAttribute: [],
            name: 'LG Code',
            value: 'Customer Portal',
          },
          {
            multiSetAttribute: [],
            name: 'UPI Handle',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Name of Company',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Product Purchased',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Name of Corporate',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'GMC COI Number',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Partner Customer ID',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Employee ID',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Whether Employee of Affiliate',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Affiliate employee discount',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Affiliate Employee ID',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Name of Affiliate',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Whether employee of Aditya Birla Group',
            value: 'NO',
          },
          {
            multiSetAttribute: [],
            name: 'Cross Sale Reference Number',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Cross-Sell',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'Cross Sell Flag',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'Bank Reference Number1',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Bank Reference Number2',
            value: '',
          },
          {
            multiSetAttribute: [
              {
                attributes: [
                  {
                    name: 'ID Type',
                    value: 'VBU',
                  },
                  {
                    name: 'ID Number',
                    value: 'XXXXXXXX8917',
                  },
                ],
                setNo: '1',
              },
              {
                attributes: [
                  {
                    name: 'ID Type',
                    value: 'PAN',
                  },
                  {
                    name: 'ID Number',
                    value: 'BNZPM2501F',
                  },
                ],
                setNo: '2',
              },
            ],
            name: 'ID Details',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Is The Mailing/Communication Address Same As The Primary Address?',
            value: 'Y',
          },
          {
            multiSetAttribute: [],
            name: 'Number of Members',
            value: '2',
          },
          {
            multiSetAttribute: [],
            name: 'Customer Signature Date',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Existing Policy Number',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Previous Policy Expiry Date',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Assign Policy',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Assignee Name',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Applicable Sum Insured',
            value: '1000000',
          },
          {
            multiSetAttribute: [],
            name: 'Family Size',
            value: 'SE-SP',
          },
          {
            multiSetAttribute: [],
            name: 'Lead ID',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Source Code',
            value: 'CUSTPORT',
          },
          {
            multiSetAttribute: [],
            name: 'NB Channel',
            value: '7',
          },
          {
            multiSetAttribute: [],
            name: 'SPID',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'TCN',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'CRTNO',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Proposer Annual Income',
            value: '2000000',
          },
          {
            multiSetAttribute: [],
            name: 'Type of Business',
            value: 'NB',
          },
          {
            multiSetAttribute: [],
            name: 'Go Green',
            value: '1',
          },
          {
            multiSetAttribute: [],
            name: 'Application Number entry 1',
            value: '2409290955193579',
          },
          {
            multiSetAttribute: [],
            name: 'Application Number entry 2',
            value: '2409290955193579',
          },
          {
            multiSetAttribute: [],
            name: 'Employee Number',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Policy Tenure',
            value: '1Y',
          },
          {
            multiSetAttribute: [],
            name: 'Employee Discount',
            value: 'N',
          },
          {
            multiSetAttribute: [],
            name: 'WhatsApp Number',
            value: '9827348973',
          },
          {
            multiSetAttribute: [],
            name: 'Partner Reference Number 3',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Partner Reference Number 4',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Policy Holder also a Member?',
            value: 'Y',
          },
          {
            multiSetAttribute: [],
            name: 'Partner Reference Number 5',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Partner Reference Number 6',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'International Contact',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'International Address',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Country of Residence',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'GST Exemption Flag',
            value: '',
          },
          {
            multiSetAttribute: [
              {
                attributes: [
                  {
                    name: 'Nominee Name',
                    value: 'spouce',
                  },
                  {
                    name: 'Nominee Contact Number',
                    value: '9812738971',
                  },
                  {
                    name: 'Nominee Date of Birth',
                    value: '2007-10-20',
                  },
                  {
                    name: 'Age',
                    value: '',
                  },
                  {
                    name: 'Gender',
                    value: 'F',
                  },
                  {
                    name: 'Appointee Name',
                    value: 'Appointee',
                  },
                  {
                    name: 'Address of Nominee',
                    value: 'abc',
                  },
                  {
                    name: 'Relationship with Proposer',
                    value: '13',
                  },
                  {
                    name: 'Relationship of Appointee with the Nominee',
                    value: '13',
                  },
                  {
                    name: 'Appointee Mobile number',
                    value: '',
                  },
                  {
                    name: 'Appointee Age',
                    value: '34',
                  },
                  {
                    name: 'Nominee %',
                    value: '100',
                  },
                ],
              },
            ],
            name: 'Nominee',
            value: '',
          },
          {
            multiSetAttribute: [],
            name: 'Select Type of Address',
            value: 'Permanent',
          },
        ],
        paymentInfo: [],
        relations: [
          {
            role: 'POLICY-HOL',
            party: {
              indvOrOrg: 'I',
              partyCode: '',
              initial: 'Mr.',
              firstName: 'DURAISAMY',
              middleName: 'test',
              lastName: 'MANIKANDAN',
              otherName: '',
              businessName: '',
              dateofBirth: '16/07/1986',
              citizenshipId: '',
              sex: 'M',
              nationality: 'IN',
              occupation: '1051',
              parentPartyCode: '',
              effectiveDate: '',
              company: '',
              contactDetails: [
                {
                  typeOfContact: 'Permanent',
                  effectiveDate: '',
                  addressLine1: '201 PLOT NO 544 BUDDHA',
                  addressLine2: 'NAGAR ROAD NO 6',
                  addressLine3: '',
                  pinCode: '500092',
                  districtCode: '',
                  cityCode: '',
                  stateCode: '',
                  countryCode: '',
                  telephoneNumber: '',
                  mobileNumber: '9827348973',
                  faxNumber: '',
                  email1: 'asdfsa@gmail.com',
                  email2: '',
                  email3: '',
                },
              ],
              partyDetails: [
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Alternate Mobile Number',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Alternate Email Id',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Marital Status',
                    attributeValue: 'M005',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Country of Residence',
                    attributeValue: 'India',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Country of Origin',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'HNI Customer',
                    attributeValue: 'N',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'CEO Club Advisor Customer',
                    attributeValue: 'N',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Priority Customer',
                    attributeValue: 'NO',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Sensitive Customer',
                    attributeValue: 'N',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Wellness ID',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [
                    {
                      setNo: '1',
                      attributes: [
                        {
                          attributeName: 'Bank A/C No',
                          attributeValue: '981273917238172839',
                        },
                        {
                          attributeName: 'Confirm Account Number',
                          attributeValue: '981273917238172839',
                        },
                        {
                          attributeName: 'IFSC Code',
                          attributeValue: 'SBIN0003021',
                        },
                        {
                          attributeName: 'MICR Code',
                          attributeValue: '',
                        },
                        {
                          attributeName: 'Bank Name',
                          attributeValue: '',
                        },
                        {
                          attributeName: 'Bank Branch Name',
                          attributeValue: '',
                        },
                        {
                          attributeName: 'Bank Account Type',
                          attributeValue: 'SAVINGS',
                        },
                        {
                          attributeName: 'DR GL Code',
                          attributeValue: '',
                        },
                        {
                          attributeName: 'CR GL Code',
                          attributeValue: '',
                        },
                        {
                          attributeName: 'Primary / Secondary',
                          attributeValue: 'PRIMARY',
                        },
                      ],
                    },
                  ],
                  attributes: {
                    attributeName: 'Bank Account Details',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Employee ID',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Company',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Customer Type',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Partner Cust ID',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'GST Registration Type',
                    attributeValue: 'CON',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'State',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'PAN Number',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Series Number of GST',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'WhatsApp Number',
                    attributeValue: '9827348973',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'STD Code',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Emergency Contact Number',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Educational Qualification',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName:
                      'Is The Mailing/Communication Address Same As The Primary Address?',
                    attributeValue: 'Y',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'CLIENT_GEOGRAPHY',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Priority Customer Remarks',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Do you have any EIA account No ?',
                    attributeValue: 'N',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'EIA Account Number',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'EIA Account With',
                    attributeValue: '',
                  },
                },
                {
                  multiSetAttribute: [],
                  attributes: {
                    attributeName: 'Type of Account',
                    attributeValue: 'ORES',
                  },
                },
              ],
            },
            relationAttribute: [],
          },
          {
            role: 'AGENT',
            party: {
              indvOrOrg: '',
              partyCode: '5100003',
              initial: '',
              firstName: '',
              middleName: '',
              lastName: '',
              otherName: '',
              businessName: '',
              dateofBirth: '',
              citizenshipId: '',
              sex: '',
              nationality: '',
              occupation: '',
              parentPartyCode: '',
              effectiveDate: '',
              company: '',
              contactDetails: [
                {
                  typeOfContact: '',
                  effectiveDate: '',
                  addressLine1: '',
                  addressLine2: '',
                  addressLine3: '',
                  pinCode: '',
                  districtCode: '',
                  cityCode: '',
                  stateCode: '',
                  countryCode: '',
                  telephoneNumber: '',
                  mobileNumber: '',
                  faxNumber: '',
                  email1: '',
                  email2: '',
                  email3: '',
                },
              ],
              partyDetails: [],
            },
            relationAttribute: [],
          },
        ],
        members: [
          {
            inceptionDate: '29/09/2024',
            grosspremium: '',
            netpremium: '',
            loading: '',
            discount: '',
            expiryDate: '',
            party: {
              indvOrOrg: 'I',
              partyCode: '',
              initial: 'R001.',
              firstName: 'DURAISAMY',
              middleName: 'test',
              lastName: 'MANIKANDAN',
              otherName: '',
              businessName: '',
              dateofBirth: '16/07/1986',
              citizenshipId: '',
              sex: 'M',
              nationality: 'IN',
              occupation: '1051',
              parentPartyCode: '',
              effectiveDate: '',
              company: '',
              contactDetails: [
                {
                  typeOfContact: 'Permanent',
                  effectiveDate: '',
                  addressLine1: '201 PLOT NO 544 BUDDHA',
                  addressLine2: 'NAGAR ROAD NO 6',
                  addressLine3: '',
                  pinCode: '500092',
                  districtCode: '',
                  cityCode: '',
                  stateCode: '',
                  countryCode: '',
                  telephoneNumber: '',
                  faxNumber: '',
                  mobileNumber: '9827348973',
                  email1: 'asdfsa@gmail.com',
                  email2: '',
                  email3: '',
                },
              ],
            },
            memberDetails: [
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'testID',
                        value: '',
                      },
                      {
                        name: 'Test Category',
                        value: '',
                      },
                      {
                        name: 'Test Type',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'Test Component',
                        value: '',
                      },
                      {
                        name: 'Unit',
                        value: '',
                      },
                      {
                        name: 'Min Normal Value',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'Max Normal Value',
                        value: '',
                      },
                      {
                        name: 'Test Results',
                        value: '',
                      },
                      {
                        name: 'Underwriting Remarks',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'ActualValue',
                        value: '',
                      },
                    ],
                  },
                ],
                name: '',
                value: '',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Alternate Mobile Number',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'Alternate Email Id',
                        value: '',
                      },
                    ],
                  },
                ],
                name: '',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Full Name',
                value: 'DURAISAMY MANIKANDAN',
              },
              {
                multiSetAttribute: [],
                name: 'Politically Exposed Person',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'ABHA Verified',
                value: 'No',
              },
              {
                multiSetAttribute: [],
                name: 'Upfront Good Health Discount Applicable',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Options',
                value: '',
              },
              {
                name: 'Discount and Loading',
                value: '',
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Loading Rate',
                        value: '',
                      },
                      {
                        name: 'Applicable Level',
                        value: '',
                      },
                      {
                        name: 'Discount / Loading Type Policy',
                        value: '',
                      },
                      {
                        name: 'Discount Rate',
                        value: '',
                      },
                      {
                        name: 'Loading / Discount Reason Policy',
                        value: '',
                      },
                      {
                        name: 'If Others please specify',
                        value: '',
                      },
                      {
                        name: 'Discount / Loading Rate',
                        value: '',
                      },
                      {
                        name: 'Plan of Policy',
                        value: '',
                      },
                      {
                        name: 'Discount / Loading Type',
                        value: '',
                      },
                    ],
                  },
                ],
              },
              {
                multiSetAttribute: [],
                name: 'Applicable SI',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Have any active, base domestic indemnity cover of at least Rs 10 lakh SI',
                value: 'NO',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Exact Diagnosis',
                        value: '',
                      },
                      {
                        name: 'Date of Diagnosis',
                        value: '',
                      },
                      {
                        name: 'Last Consultation Date',
                        value: '',
                      },
                      {
                        name: 'Details of Treatment given (Hospitalised/OPD)',
                        value: '',
                      },
                      {
                        name: 'Doctor/Hospital Name',
                        value: '',
                      },
                      {
                        name: 'Doctor/Hospital Phone Number',
                        value: '',
                      },
                      {
                        name: 'Remarks',
                        value: '',
                      },
                      {
                        name: 'Health Card Number',
                        value: '',
                      },
                    ],
                  },
                ],
                name: 'Mecidal Test Report',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Relationship',
                value: '24',
              },
              {
                multiSetAttribute: [],
                name: 'Marital Status',
                value: 'M005',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'ID Type',
                        value: 'PAN',
                      },
                      {
                        name: 'ID Number',
                        value: 'BNZPM2501F',
                      },
                    ],
                    setNo: '1',
                  },
                ],
                name: 'ID Details',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Weight (in kgs)',
                value: '65',
              },
              {
                multiSetAttribute: [],
                name: 'Height of the Insured (in cms)',
                value: '180.34',
              },
              {
                multiSetAttribute: [],
                name: 'Principal Member for Multiple Rider',
                value: 'NA',
              },
              {
                multiSetAttribute: [],
                name: 'Policy-holder ZIP Code',
                value: '500092',
              },
              {
                multiSetAttribute: [],
                name: 'Room Category',
                value: 'UPTOSI',
              },
              {
                multiSetAttribute: [],
                name: 'GHD Applicable',
              },
              {
                multiSetAttribute: [],
                name: 'GHD Remarks',
              },
              {
                multiSetAttribute: [],
                name: 'Deductible_Amount',
                value: '0',
              },
              {
                multiSetAttribute: [],
                name: 'Is Chronic Disease ?',
                value: 'NO',
              },
              {
                multiSetAttribute: [],
                name: 'Chronic Type',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Is Member address same as that of proposer ?',
                value: 'Y',
              },
              {
                multiSetAttribute: [],
                name: 'District Name',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: [],
                name: 'Opted zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: [],
                name: 'Occupation',
                value: '1051',
              },
              {
                multiSetAttribute: [],
                name: 'Designation',
                value: 'NA',
              },
              {
                multiSetAttribute: [],
                name: 'Annual Gross Income',
                value: '2000000',
              },
              {
                multiSetAttribute: [],
                name: 'Annual Income',
                value: '2000000',
              },
              {
                multiSetAttribute: [],
                name: 'Nationality',
                value: 'IN',
              },
              {
                multiSetAttribute: [],
                name: 'Country of Residence',
                value: 'India',
              },
              {
                multiSetAttribute: [],
                name: 'HNI Customer',
                value: 'N',
              },
              {
                multiSetAttribute: [],
                name: 'CEO Club Advisor Customer',
                value: 'N',
              },
              {
                multiSetAttribute: [],
                name: 'District',
                value: '500092',
              },
              {
                multiSetAttribute: [],
                name: 'Email ID',
                value: 'asdfsa@gmail.com',
              },
              {
                multiSetAttribute: [],
                name: 'Priority Customer',
                value: 'NO',
              },
              {
                multiSetAttribute: [],
                name: 'Sensitive Customer',
                value: 'N',
              },
              {
                multiSetAttribute: [],
                name: 'WhatsApp Number',
                value: '9827348973',
              },
              {
                multiSetAttribute: [],
                name: 'Applicable Sum Insured',
                value: '1000000',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Serial Number',
                        value: '3',
                      },
                      {
                        name: 'Previous Policy/Proposal Number',
                        value: '',
                      },
                      {
                        name: 'Name of Insured Person',
                        value: '',
                      },
                      {
                        name: 'Previous Policy Start Date',
                        value: '',
                      },
                      {
                        name: 'Previous Policy Expiry Date',
                        value: '',
                      },
                      {
                        name: 'Sum Insured in Previous Policy',
                        value: '',
                      },
                      {
                        name: 'Claim Exist',
                        value: 'N',
                      },
                    ],
                  },
                ],
                name: 'Existing Insurance Details with other Company',
                value: '',
              },
            ],
            benefits: [
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'SUPCRD',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'SCOP',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'ANCANC',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'ANHLTH',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'COMV',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'RVCV',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [
                  {
                    multiSetAttribute: [],
                    name: 'Applicable Sum Insured',
                    value: '500',
                  },
                ],
              },
            ],
          },
          {
            inceptionDate: '29/09/2024',
            grosspremium: '',
            netpremium: '',
            loading: '',
            discount: '',
            expiryDate: '',
            party: {
              indvOrOrg: 'I',
              partyCode: '',
              initial: 'R002.',
              firstName: 'female',
              middleName: 'test',
              lastName: 'spouce',
              otherName: '',
              businessName: '',
              dateofBirth: '02/01/1997',
              citizenshipId: '',
              sex: 'F',
              nationality: 'IN',
              occupation: '915',
              parentPartyCode: '',
              effectiveDate: '',
              company: '',
              contactDetails: [
                {
                  typeOfContact: 'Permanent',
                  effectiveDate: '',
                  addressLine1: '201 PLOT NO 544 BUDDHA',
                  addressLine2: 'NAGAR ROAD NO 6',
                  addressLine3: '',
                  pinCode: '500092',
                  districtCode: '',
                  cityCode: '',
                  stateCode: '',
                  countryCode: '',
                  telephoneNumber: '',
                  faxNumber: '',
                  mobileNumber: '9609670540',
                  email1: 'test123@gmail.com',
                  email2: '',
                  email3: '',
                },
              ],
            },
            memberDetails: [
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'testID',
                        value: '',
                      },
                      {
                        name: 'Test Category',
                        value: '',
                      },
                      {
                        name: 'Test Type',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'Test Component',
                        value: '',
                      },
                      {
                        name: 'Unit',
                        value: '',
                      },
                      {
                        name: 'Min Normal Value',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'Max Normal Value',
                        value: '',
                      },
                      {
                        name: 'Test Results',
                        value: '',
                      },
                      {
                        name: 'Underwriting Remarks',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'ActualValue',
                        value: '',
                      },
                    ],
                  },
                ],
                name: '',
                value: '',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Alternate Mobile Number',
                        value: '',
                      },
                    ],
                  },
                  {
                    attributes: [
                      {
                        name: 'Alternate Email Id',
                        value: '',
                      },
                    ],
                  },
                ],
                name: '',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Full Name',
                value: 'female spouce',
              },
              {
                multiSetAttribute: [],
                name: 'Politically Exposed Person',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'ABHA Verified',
                value: 'No',
              },
              {
                multiSetAttribute: [],
                name: 'Upfront Good Health Discount Applicable',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Options',
                value: '',
              },
              {
                name: 'Discount and Loading',
                value: '',
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Loading Rate',
                        value: '',
                      },
                      {
                        name: 'Applicable Level',
                        value: '',
                      },
                      {
                        name: 'Discount / Loading Type Policy',
                        value: '',
                      },
                      {
                        name: 'Discount Rate',
                        value: '',
                      },
                      {
                        name: 'Loading / Discount Reason Policy',
                        value: '',
                      },
                      {
                        name: 'If Others please specify',
                        value: '',
                      },
                      {
                        name: 'Discount / Loading Rate',
                        value: '',
                      },
                      {
                        name: 'Plan of Policy',
                        value: '',
                      },
                      {
                        name: 'Discount / Loading Type',
                        value: '',
                      },
                    ],
                  },
                ],
              },
              {
                multiSetAttribute: [],
                name: 'Applicable SI',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Have any active, base domestic indemnity cover of at least Rs 10 lakh SI',
                value: 'NO',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Exact Diagnosis',
                        value: '',
                      },
                      {
                        name: 'Date of Diagnosis',
                        value: '',
                      },
                      {
                        name: 'Last Consultation Date',
                        value: '',
                      },
                      {
                        name: 'Details of Treatment given (Hospitalised/OPD)',
                        value: '',
                      },
                      {
                        name: 'Doctor/Hospital Name',
                        value: '',
                      },
                      {
                        name: 'Doctor/Hospital Phone Number',
                        value: '',
                      },
                      {
                        name: 'Remarks',
                        value: '',
                      },
                      {
                        name: 'Health Card Number',
                        value: '',
                      },
                    ],
                  },
                ],
                name: 'Mecidal Test Report',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Relationship',
                value: '13',
              },
              {
                multiSetAttribute: [],
                name: 'Marital Status',
                value: 'M005',
              },
              {
                multiSetAttribute: [],
                name: 'Weight (in kgs)',
                value: '65',
              },
              {
                multiSetAttribute: [],
                name: 'Height of the Insured (in cms)',
                value: '157.48',
              },
              {
                multiSetAttribute: [],
                name: 'Principal Member for Multiple Rider',
                value: 'NA',
              },
              {
                multiSetAttribute: [],
                name: 'Policy-holder ZIP Code',
                value: '500092',
              },
              {
                multiSetAttribute: [],
                name: 'Room Category',
                value: 'UPTOSI',
              },
              {
                multiSetAttribute: [],
                name: 'GHD Applicable',
              },
              {
                multiSetAttribute: [],
                name: 'GHD Remarks',
              },
              {
                multiSetAttribute: [],
                name: 'Deductible_Amount',
                value: '0',
              },
              {
                multiSetAttribute: [],
                name: 'Is Chronic Disease ?',
                value: 'NO',
              },
              {
                multiSetAttribute: [],
                name: 'Chronic Type',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Is Member address same as that of proposer ?',
                value: 'Y',
              },
              {
                multiSetAttribute: [],
                name: 'District Name',
                value: '',
              },
              {
                multiSetAttribute: [],
                name: 'Zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: [],
                name: 'Opted zone',
                value: 'Zone III',
              },
              {
                multiSetAttribute: [],
                name: 'Occupation',
                value: '915',
              },
              {
                multiSetAttribute: [],
                name: 'Designation',
                value: 'NA',
              },
              {
                multiSetAttribute: [],
                name: 'Annual Gross Income',
                value: '0',
              },
              {
                multiSetAttribute: [],
                name: 'Annual Income',
                value: '0',
              },
              {
                multiSetAttribute: [],
                name: 'Nationality',
                value: 'IN',
              },
              {
                multiSetAttribute: [],
                name: 'Country of Residence',
                value: 'India',
              },
              {
                multiSetAttribute: [],
                name: 'HNI Customer',
                value: 'N',
              },
              {
                multiSetAttribute: [],
                name: 'CEO Club Advisor Customer',
                value: 'N',
              },
              {
                multiSetAttribute: [],
                name: 'District',
                value: '500092',
              },
              {
                multiSetAttribute: [],
                name: 'Email ID',
                value: 'test123@gmail.com',
              },
              {
                multiSetAttribute: [],
                name: 'Priority Customer',
                value: 'NO',
              },
              {
                multiSetAttribute: [],
                name: 'Sensitive Customer',
                value: 'N',
              },
              {
                multiSetAttribute: [],
                name: 'WhatsApp Number',
                value: '9827348973',
              },
              {
                multiSetAttribute: [],
                name: 'Applicable Sum Insured',
                value: '1000000',
              },
              {
                multiSetAttribute: [
                  {
                    attributes: [
                      {
                        name: 'Serial Number',
                        value: '3',
                      },
                      {
                        name: 'Previous Policy/Proposal Number',
                        value: '',
                      },
                      {
                        name: 'Name of Insured Person',
                        value: '',
                      },
                      {
                        name: 'Previous Policy Start Date',
                        value: '',
                      },
                      {
                        name: 'Previous Policy Expiry Date',
                        value: '',
                      },
                      {
                        name: 'Sum Insured in Previous Policy',
                        value: '',
                      },
                      {
                        name: 'Claim Exist',
                        value: 'N',
                      },
                    ],
                  },
                ],
                name: 'Existing Insurance Details with other Company',
                value: '',
              },
            ],
            benefits: [
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'SUPCRD',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'SCOP',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'ANCANC',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'ANHLTH',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'COMV',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [],
              },
              {
                inceptionDate: '',
                expiryDate: '',
                benefitCode: 'RVCV',
                benefitName: '',
                premium: '0.0',
                mandOpt: '',
                attributes: [
                  {
                    multiSetAttribute: [],
                    name: 'Applicable Sum Insured',
                    value: '1000',
                  },
                ],
              },
            ],
          },
        ],
        documents: [],
        notes: [],
      };

      const { data } = await firstValueFrom(
        this.httpService.post(
          'https://pas-core-453999121690.us-central1.run.app/pas/createDetailedQuote',
          quoteData,
        ),
      );

      console.log('Response from PAS createDetailed API:', data);
    } catch (error) {
      // Handle errors appropriately, e.g., logging, throwing a custom exception
      console.error(
        'Error calling createDetailedQuote PAS API:',
        error.message,
      );
    }

    quote['products'] = products;

    //Sync changes to Query database
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);

    return quote;
  }

  async publishEvent(quote) {
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);
  }

  async syncQueryDatabase(quoteId: number, quote: any) {
    return await this.firestoreService.createOrUpdate(
      this.QUOTE_COLLECTION,
      quoteId,
      quote,
    );
  }

  remove(id: number) {
    return `This action removes a #${id} quote`;
  }

  async getProducts(productRecommendationDto: ProductRecommendationDto) {
    const products = await firstValueFrom(
      this.httpService.post(
        'https://product-service-dnhiaxv6nq-uc.a.run.app/products/recommendation',
        productRecommendationDto,
      ),
    );
    return products;
  }
}
