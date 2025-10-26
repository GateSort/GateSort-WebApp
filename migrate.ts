import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
  const migrationClient = postgres(process.env.DB_URL!, { max: 1 });
  const db = drizzle(migrationClient);
  
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations completed!');
  
  await migrationClient.end();
};

runMigrations();
