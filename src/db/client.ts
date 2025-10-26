import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DB_URL!);
const db = drizzle(client);

export { db, client };