import 'dotenv/config';
import * as mongoDB from 'mongodb';

const DB_CONN: string = process.env.DB_CONN || 'mongodb://localhost:27017/';
const DB_NAME: string = process.env.DB_NAME || 'test';
const USERS_COLLECTION: string = process.env.USERS_COLLECTION || 'users';

const CACHESIZE = process.env.CACHESIZE || 10; // Размер кэша

const req: string[] = [
    'Alex',
    'Stinky1',
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

interface IRes {
    data: Object;
    count: number;
    date: Date;
}

interface ICache extends Record<string, any> {
    get: (name: string) => Promise<Object>;
}

const DBCache: ICache = {
    get: async function (name: string): Promise<Object> {
        if (!this[name]) {
            const check: Object | null = (await collections?.users?.findOne({ name: name }) || null);

            if (!check) {
                return {};
            }

            const res: IRes = {
                data: check,
                count: 0,
                date: new Date(),
            };

            this[name] = res;
        }

        const temp = this[name];
        delete this[name];

        this[name] = temp;

        const keys = Object.keys(this);

        if (keys.length >= CACHESIZE) {
            delete this[keys[1]];
        }

        return this[name];
    },
};

(async function () {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN);

    await client.connect();

    const db: mongoDB.Db = client.db(DB_NAME);

    const collection: mongoDB.Collection = db.collection(USERS_COLLECTION);

    collections.users = collection;

    for (let i: number = 0; i < 14; i++) {
        await DBCache.get(req[i]);
    }

    setTimeout(() => { console.log(DBCache) }, 10000);
})();