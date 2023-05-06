import { Firestore } from "@google-cloud/firestore";
import { Injectable } from "@nestjs/common";
import { CreateQuoteDocumentDto } from "src/quote/dto/create-quote-document.dto";

@Injectable() 
export class FirestoreService {
    readonly PROJECT_ID = "sahi-test";
    private db;

    constructor() {
        this.db = new Firestore({
            projectId: this.PROJECT_ID
          });
    }

    async createOrUpdate(collectionName: string, quoteId: number, quote: CreateQuoteDocumentDto) {
        const res = await this.db.collection(collectionName).doc(quoteId.toString()).set(quote);
        return res;
    }

    async findById(collectionName: string, quoteId: number) {
        const quoteRef = this.db.collection(collectionName).doc(quoteId.toString());
        const doc = await quoteRef.get();
        const data = doc.data();
        const exists = doc.exists;

        return {
            exists,
            data
        }
    }

    async findAll(collectionName: string) {
        const quotesRef = this.db.collection(collectionName);
        const snapshot = await quotesRef.get();

        const quotes = [];
        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
            quotes.push(doc.data());
          });

        return quotes;
    }
}