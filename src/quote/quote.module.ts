import { Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { User } from './entities/user.entity';
import { InsurableParty } from './entities/insurable-party.entity';
import { Rider } from './entities/rider.entity';
import { PubSubModule } from 'src/providers/pub-sub/pub-sub.module';
import { FirestoreModule } from 'src/providers/firestore/firestore.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, User, InsurableParty, Rider]),
    PubSubModule,
    FirestoreModule
  ],
  controllers: [QuoteController],
  providers: [QuoteService]
})
export class QuoteModule { }
