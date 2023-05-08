import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteChangeEvent } from './dto/quote-change-event.dto';
import { CreateQuoteDocumentDto } from './dto/create-quote-document.dto';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

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
  eventHandler(@Body() event: QuoteChangeEvent) {
    console.log("event : ", event);
    const { message: { data } } = event;
    const parsedData: CreateQuoteDocumentDto = formatMessageData(data);
    console.log("parsed data", parsedData);

    const { id } = parsedData;

    return this.quoteService.syncQueryDatabase(id, parsedData);
  }
}
function formatMessageData(data: any): CreateQuoteDocumentDto {
  throw new Error('Function not implemented.');
}

