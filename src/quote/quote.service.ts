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

    if(dateOfBirth.invalid) {
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
    const { data: products} = await this.getProducts(productRecommendationDto);
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

    const quote = await this.quoteRepository.findOne({
      where: {
        id: quoteId
      },
      relations: {
        user: true,
        insurableParties: true,
        riders: true
      }
    });

    quote.sumInsured = sumInsured;
    quote.selectedProductId = selectedProductId;
    quote.riders = riders;
    quote.tenure = tenure;

    const quoteRes = await this.quoteRepository.save(quote);

    const { user: {dob, gender} } = quote;

    const dateOfBirth = DateTime.fromISO(dob);
    const { years: age } = dateOfBirth.diffNow('years');
    const productRecommendationDto: ProductRecommendationDto = {
      sumInsured,
      selectedProductId,
      gender,
      age
    }

    //Sync changes to Query database
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);

    // Mock flow of products being returned by PAS
    const products = await this.getProducts(productRecommendationDto);
    quoteRes["products"] = products;

    //select the price of the selectedProductId and adds up the cost of the selected riders

    return quoteRes;
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


    // let products: Array<{
    //   id: number;
    //   name: string;
    //   description: string;
    //   tenures: Array<{
    //     duration: number;
    //     price: number;
    //   }>,
    //   riders: Array<{
    //     id: number;
    //     name: string;
    //     description: string;
    //     price: number;
    //   }>
    // }>;

    // if (selectedProductId) {
    //   products = [
    //     {
    //       id: 1001,
    //       name: "Health care product",
    //       description: "Covers all kinds of health issues.",
    //       tenures: [
    //         {
    //           duration: 12,
    //           price: 12000
    //         },
    //         {
    //           duration: 24,
    //           price: 20000
    //         }
    //       ],
    //       riders: [
    //         {
    //           id: 2011,
    //           name: "Ambulance service",
    //           description: "24 hr ambulance charges covered",
    //           price: 200
    //         }
    //       ]
    //     }
    //   ]
    // } else {
    //   products = [
    //     {
    //       id: 1001,
    //       name: "Health care product",
    //       description: "Covers all kinds of health issues.",
    //       tenures: [
    //         {
    //           duration: 12,
    //           price: 12000
    //         },
    //         {
    //           duration: 24,
    //           price: 20000
    //         }
    //       ],
    //       riders: [
    //         {
    //           id: 2011,
    //           name: "Ambulance service",
    //           description: "24 hr ambulance charges covered",
    //           price: 200
    //         }
    //       ]
    //     }, {
    //       id: 1002,
    //       name: "Cancer care product",
    //       description: "Covers all kinds of cancer related issues.",
    //       tenures: [
    //         {
    //           duration: 12,
    //           price: 13000
    //         },
    //         {
    //           duration: 24,
    //           price: 24000
    //         }
    //       ],
    //       riders: [
    //         {
    //           id: 2011,
    //           name: "Ambulance service",
    //           description: "24 hr ambulance charges covered",
    //           price: 200
    //         },
    //         {
    //           id: 2012,
    //           name: "Online consultation",
    //           description: "Free online consultation",
    //           price: 100
    //         }
    //       ]
    //     }
    //   ]
    // }

    // return products;
  }
}
