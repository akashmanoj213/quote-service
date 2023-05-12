import { Firestore } from "@google-cloud/firestore";
import { Injectable } from "@nestjs/common";

@Injectable() 
export class FirestoreService {
    readonly PROJECT_ID = "pruinhlth-nprd-dev-scxlyx-7250";
    private db;

    constructor() {
        this.db = new Firestore({
            projectId: this.PROJECT_ID,
            ignoreUndefinedProperties: true
          });
    }

    async createOrUpdate<T>(collectionName: string, id: number, entity: T) {
        const res = await this.db.collection(collectionName).doc(id.toString()).set(entity);
        return res;
    }

    async findById(collectionName: string, id: number) {
        const collectionRef = this.db.collection(collectionName).doc(id.toString());
        const doc = await collectionRef.get();
        const data = doc.data();
        const exists = doc.exists;

        return {
            exists,
            data
        }
    }

    async findAll(collectionName: string) {
        const collectionRef = this.db.collection(collectionName);
        const snapshot = await collectionRef.get();

        const entities = [];
        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
            entities.push(doc.data());
          });

        return entities;
    }
}