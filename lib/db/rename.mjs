import pg from "pg";
const { Client } = pg;

const connectionString = "postgresql://postgres.edaqojinzumtekwhzfxp:T9%23vQ2%21mttcdohiwqL8%40zR4%24kW7%5EpX1%26n@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";
const client = new Client({ connectionString });

async function main() {
  await client.connect();
  try {
    await client.query("ALTER TABLE users ADD CONSTRAINT users_supabase_uid_unique UNIQUE (supabase_uid)");
    console.log("Constraint added successfully.");
  } catch (err) {
    console.log("Constraint might already exist:", err.message);
  } finally {
    await client.end();
  }
}

main();
