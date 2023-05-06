import { Injectable } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Relationship } from './entities/nominee.entity';
import { PubSubService } from 'src/providers/pub-sub/pub-sub.service';
import { FirestoreService } from 'src/providers/firestore/firestore.service';

@Injectable()
export class QuoteService {
  readonly QUOTE_PUB_SUB_TOPIC = "quote-changes";
  readonly QUOTE_COLLECTION = "quotes"
  readonly PROJECT_ID = "pruinhlth-nprd-dev-scxlyx-7250";
  private db;

  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    private pubSubService: PubSubService,
    private firestoreService: FirestoreService
  ) { }

  async create(createQuoteDto: CreateQuoteDto) {
    const { firstName, lastName, gender, dob, pincode, mobileNumber, email, type, preExistingDiseases, selectedProductId, numberOfAdults = 1, numberOfChildren = 0, nominees = [] } = createQuoteDto;

    const user: User = {
      firstName,
      lastName,
      gender,
      dob,
      pincode,
      mobileNumber,
      email
    };

    // TO DO: publish an event for creating/updating user from this object

    if (nominees.length === 0) {
      nominees.push({
        dob,
        relationship: Relationship.SELF
      })
    }
    // else case - check if the number of nominees === nunmberOfAdults + numberOfChildren

    const quote: Quote = {
      type,
      preExistingDiseases,
      user,
      nominees,
      numberOfAdults,
      numberOfChildren
    }

    await this.quoteRepository.save(quote);

    //Sync changes to Query database
    // await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);

    // Mock flow of products being returned by PAS
    const products = this.getProducts(selectedProductId);
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
    const { sumInsured, selectedProductId = null, riders = null, tenure = null } = updateQuoteDto;

    const quote = await this.quoteRepository.findOneBy({
      id: quoteId
    });

    quote.sumInsured = sumInsured;
    quote.selectedProductId = selectedProductId;
    quote.riders = riders;
    quote.tenure = tenure;

    const quoteRes = await this.quoteRepository.save(quote);

    //Sync changes to Query database
    await this.pubSubService.publishMessage(this.QUOTE_PUB_SUB_TOPIC, quote);

    // Mock flow of products being returned by PAS
    const products = this.getProducts(selectedProductId);
    quoteRes["products"] = products;

    //selects the price of the selectedProductId and adds up the cost of the selected riders

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

  getProducts(selectedProductId, tenure = null) {
    let products: Array<{
      id: number;
      name: string;
      description: string;
      tenures: Array<{
        duration: number;
        price: number;
      }>,
      riders: Array<{
        id: number;
        name: string;
        description: string;
        price: number;
      }>
    }>;

    if (selectedProductId) {
      products = [
        {
          id: 1001,
          name: "Health care product",
          description: "Covers all kinds of health issues.",
          tenures: [
            {
              duration: 12,
              price: 12000
            },
            {
              duration: 24,
              price: 20000
            }
          ],
          riders: [
            {
              id: 2011,
              name: "Ambulance service",
              description: "24 hr ambulance charges covered",
              price: 200
            }
          ]
        }
      ]
    } else {
      products = [
        {
          id: 1001,
          name: "Health care product",
          description: "Covers all kinds of health issues.",
          tenures: [
            {
              duration: 12,
              price: 12000
            },
            {
              duration: 24,
              price: 20000
            }
          ],
          riders: [
            {
              id: 2011,
              name: "Ambulance service",
              description: "24 hr ambulance charges covered",
              price: 200
            }
          ]
        }, {
          id: 1002,
          name: "Cancer care product",
          description: "Covers all kinds of cancer related issues.",
          tenures: [
            {
              duration: 12,
              price: 13000
            },
            {
              duration: 24,
              price: 24000
            }
          ],
          riders: [
            {
              id: 2011,
              name: "Ambulance service",
              description: "24 hr ambulance charges covered",
              price: 200
            },
            {
              id: 2012,
              name: "Online consultation",
              description: "Free online consultation",
              price: 100
            }
          ]
        }
      ]
    }

    return products;
  }
}
