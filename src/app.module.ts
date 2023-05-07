import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuoteModule } from './quote/quote.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './quote/entities/quote.entity';
import { User } from './quote/entities/user.entity';
import { Nominee } from './quote/entities/nominee.entity';
import { Rider } from './quote/entities/rider.entity';

@Module({
  imports: [QuoteModule, TypeOrmModule.forRoot({
    type: 'postgres',
    host: '/cloudsql/pruinhlth-nprd-dev-scxlyx-7250:asia-south1:sahi-dev',
    port: 5432,
    username: 'sahi-user',
    password: 'qwerty',
    database: 'Quotes',
    entities: [Quote, User, Nominee, Rider],
    synchronize: true
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
