import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set');
  }

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    const db = drizzle(client);

    console.log('Running migrations...'); // @allow-console
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations complete'); // @allow-console
  } catch (error) {
    console.error('Migration failed:', error); // @allow-console
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
