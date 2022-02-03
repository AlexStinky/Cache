import 'dotenv/config';
import * as mongoDB from 'mongodb';

const DB_CONN: string = process.env.DB_CONN || 'mongodb://localhost:27017/';
const DB_NAME: string = process.env.DB_NAME || 'test';
const USERS_COLLECTION: string = process.env.USERS_COLLECTION || 'users';

const REQ1 = process.env.REQ1 || 'Steve Austin';
const REQ2 = process.env.REQ2 || 'TheRock';
const REQ3 = 'not found';

const collections: { users?: mongoDB.Collection } = {};

interface IRes {
    data: Object;
    count: number;
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
            };

            this[name] = res;
        }

        this[name].count = this[name].count + 1;

        return this[name];
    }
};

(async function () {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN);

    await client.connect();

    const db: mongoDB.Db = client.db(DB_NAME);

    const collection: mongoDB.Collection = db.collection(USERS_COLLECTION);

    collections.users = collection;

    await DBCache.get(REQ1);
    await DBCache.get(REQ2);
    await DBCache.get(REQ2);
    await DBCache.get(REQ2);
    await DBCache.get(REQ3);

    setTimeout(() => console.log(DBCache), 10000);
})();