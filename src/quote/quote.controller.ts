import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { PubSubEvent } from './dto/pub-sub-event.dto';
import { CreateQuoteDocumentDto } from './dto/create-quote-document.dto';

@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) { }

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quoteService.create(createQuoteDto);
  }

  @Get()
  findAll() {
    return this.quoteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quoteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quoteService.update(+id, updateQuoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quoteService.remove(+id);
  }

  @Post("event-handler")
  eventHandler(@Body() event: PubSubEvent) {
    const { message: { data } } = event;
    const parsedData: CreateQuoteDocumentDto = this.formatMessageData(data);
    console.log("parsed data :", parsedData);

    const { id } = parsedData;

    return this.quoteService.syncQueryDatabase(id, parsedData);
  }

  formatMessageData(data: string): CreateQuoteDocumentDto {
    const bufferObj = Buffer.from(data, "base64");
    const decodedData = bufferObj.toString("utf8");
    const jsonObj = JSON.parse(decodedData);

    return jsonObj;
  }
}
