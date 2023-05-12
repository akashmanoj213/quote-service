import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuoteModule } from './quote/quote.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './quote/entities/quote.entity';
import { User } from './quote/entities/user.entity';
import { InsurableParty } from './quote/entities/insurable-party.entity';
import { Rider } from './quote/entities/rider.entity';

@Module({
  imports: [QuoteModule, TypeOrmModule.forRoot({
    type: 'postgres',
    host: '/cloudsql/pruinhlth-nprd-dev-scxlyx-7250:asia-south1:sahi-dev',
    // host: 'localhost',
    port: 5432,
    username: 'sahi-user',
    password: 'qwerty',
    // username: 'postgres',
    // password: 'qwerty',
    database: 'Quotes',
    entities: [Quote, User, InsurableParty, Rider],
    synchronize: true
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
