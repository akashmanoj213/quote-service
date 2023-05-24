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
import { DateTime } from "luxon";
import { firstValueFrom } from 'rxjs';

export type Products = Array<{
  id: number;
  name: string;
  description: string;
  basePrice: number;
  tenures: Array<{
    duration: number;
    price: number;
  }>,
  features: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
  }>,
  riders: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
  }>
}>;

@Injectable()
export class QuoteService {
  readonly QUOTE_PUB_SUB_TOPIC = "quote-changes";
  readonly USER_PUB_SUB_TOPIC = "user-changes";
  readonly QUOTE_COLLECTION = "quotes"
  readonly PROJECT_ID = "pruinhlth-nprd-dev-scxlyx-7250";

  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    private pubSubService: PubSubService,
    private firestoreService: FirestoreService,
    private readonly httpService: HttpService
  ) { }

  async create(createQuoteDto: CreateQuoteDto) {
    const { firstName, lastName, gender, dob, pincode, mobileNumber, email, type, preExistingDiseases, selectedProductId, numberOfAdults = 1, numberOfChildren = 0, insurableParties = [] } = createQuoteDto;

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
      email
    };

    const updateUserEventData = {
      ...user
    }

    // TO DO: publish an event for creating/updating user from this object

    if (insurableParties.length === 0) {
      insurableParties.push({
        dob: dateOfBirth.toSQLDate(),
        relationship: Relationship.SELF
      })
    }
    // else case - check if the number of insurableParties === nunmberOfAdults + numberOfChildren

    const quote: Quote = {
      type,
      preExistingDiseases,
      user,
      insurableParties,
      numberOfAdults,
      numberOfChildren
    }

    await this.quoteRepository.save(quote);

    //Sync changes to Query database
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);
    //Publish user details for user-service to save changes
    await this.pubSubService.publishMessage(this.USER_PUB_SUB_TOPIC, updateUserEventData);

    // Mock flow of products being returned by PAS
    const { years: age } = dateOfBirth.diffNow('years');

    const productRecommendationDto: ProductRecommendationDto = {
      selectedProductId,
      gender,
      age: +(Math.abs(age).toFixed())
    }
    const { data: products } = await this.getProducts(productRecommendationDto);
    quote["products"] = products;

    return quote;
  }

  async findAll() {
    return await this.firestoreService.findAll(this.QUOTE_COLLECTION);
  }

  async findOne(quoteId: number) {
    const res = await this.firestoreService.findById(this.QUOTE_COLLECTION, quoteId);

    if (!res.exists)
      return {}
    else
      return res.data;
  }

  async update(quoteId: number, updateQuoteDto: UpdateQuoteDto) {
    const { sumInsured, selectedProductId, riders, tenure } = updateQuoteDto;

    let quote = await this.quoteRepository.findOne({
      where: {
        id: quoteId
      },
      relations: {
        user: true,
        insurableParties: true,
        riders: true
      }
    });

    const { user: { dob, gender } } = quote;

    const dateOfBirth = DateTime.fromISO(dob);
    const { years: age } = dateOfBirth.diffNow('years');

    const productRecommendationDto: ProductRecommendationDto = {
      sumInsured,
      selectedProductId,
      gender,
      age
    }

    // Mock flow of products being returned by PAS
    const { data: products } = await this.getProducts(productRecommendationDto);

    if (!products.length) {
      throw new Error("No product record found !");
    }

    let totalPrice = selectedProductId ? products[0].basePrice : 0;

    if (riders && riders.length) {
      const { riders: productRiders } = products[0];
      const selectedRiders = riders.map(rider => rider.riderId);

      productRiders.forEach(rider => {
        if (selectedRiders.includes(rider.riderId)) {
          totalPrice += rider.price;
        }
      });
    }

    quote = {
      ...quote,
      ...sumInsured && { sumInsured },
      ...selectedProductId && { selectedProductId },
      ...riders && { riders },
      ...tenure && { tenure },
      ...totalPrice && { totalPrice }
    }

    await this.quoteRepository.save(quote);
    quote["products"] = products;

    //Sync changes to Query database
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);

    return quote;
  }

  async publishEvent(quote) {
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);
  }

  async syncQueryDatabase(quoteId: number, quote: any) {
    return await this.firestoreService.createOrUpdate(this.QUOTE_COLLECTION, quoteId, quote);
  }

  remove(id: number) {
    return `This action removes a #${id} quote`;
  }

  async getProducts(productRecommendationDto: ProductRecommendationDto) {
    const products = await firstValueFrom(this.httpService.post('https://product-service-dnhiaxv6nq-uc.a.run.app/products/recommendation', productRecommendationDto));
    return products;
  }
}
