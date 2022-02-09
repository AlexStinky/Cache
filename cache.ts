import 'dotenv/config';
import * as mongoDB from 'mongodb';

const DB_CONN: string = process.env.DB_CONN || 'mongodb://localhost:27017/';
const DB_NAME: string = process.env.DB_NAME || 'test';
const USERS_COLLECTION: string = process.env.USERS_COLLECTION || 'users';

const CACHESIZE = process.env.CACHESIZE || 10; // Размер кэша

const req: string[] = [
    'Alex',
    'Stinky',
    'The Rock',
    'Steve Austin',
    'Triple H',
    'Randy Orton',
    'The Rock',
    'John Cena',
    'Batista',
    'Roman Reigns',
    'Batista',
    'Dean Ambrose',
    'Seth Rollins',
    'Hulk Hogan',
];

const collections: { users?: mongoDB.Collection } = {};

class DBCache {
    max: number;
    cache = new Map<string, Object>();
    
    constructor(max: number = 5) {
        this.max = max;
    }

    async get (key: string): Promise<any> {
        if (this.cache.size === this.max) this.cache.delete(this.first());

        let item: any = this.cache.get(key);

        if (item) {
            this.cache.delete(key);
            this.cache.set(key, item);
        } else {
            item = (await collections?.users?.findOne({ name: key }) || null);

            if (!item) {
                return {};
            }

            this.cache.set(key, item);
        }

        return item;
    }

    first() {
        return this.cache.keys().next().value;
    }
}

(async function () {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN);

    await client.connect();

    const db: mongoDB.Db = client.db(DB_NAME);

    const collection: mongoDB.Collection = db.collection(USERS_COLLECTION);

    collections.users = collection;

    const dbcache = new DBCache();

    for (let i: number = 0; i < 14; i++) {
        await dbcache.get(req[i]);
    }

    setTimeout(() => { console.log(dbcache) }, 10000);
})();