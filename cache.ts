import 'dotenv/config';
import * as mongoDB from 'mongodb';
import * as redis from 'redis';

const DB_CONN: string = process.env.DB_CONN || 'mongodb://localhost:27017/';
const DB_NAME: string = process.env.DB_NAME || 'test';
const USERS_COLLECTION: string = process.env.USERS_COLLECTION || 'users';

const PORTREDIS: string = process.env.PORT_REDIS || '6379';

const redisClient = redis.createClient();

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

            const keys: any[] = Object.keys(this).sort((a: string, b: string) => Date.parse(this[a].date) - Date.parse(this[b].date));

            if (keys.length <= CACHESIZE) {
                this[name] = res;
            } else {
                delete this[keys[1]];
                this[name] = res;
            }
        }

        this[name].count = this[name].count + 1;

        return this[name];
    },
};

async function getReq (req: string): Promise<Object> {
    const check: Object | null = (await collections?.users?.findOne({ name: req }) || null);

    if (check) {
        console.log(`[Mongo] ${check}`);

        await redisClient.set(req, JSON.stringify(check));

        return check;
    }

    return {};
}

async function isCached (req: string, next: Function): Promise<Object> {
    const data = await redisClient.get(req);

    if (!data) {
        return next(req);
    } else {
        console.log(`[Redis] ${data}`);

        return data;
    }
};

(async function () {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN);

    await client.connect();
    await redisClient.connect();

    const db: mongoDB.Db = client.db(DB_NAME);

    const collection: mongoDB.Collection = db.collection(USERS_COLLECTION);

    collections.users = collection;

    for (let i: number = 0; i < 14; i++) {
        await isCached(req[i], getReq);
    }
})();