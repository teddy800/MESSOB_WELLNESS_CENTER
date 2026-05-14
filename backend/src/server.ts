import app from "./app";
import { env } from "./config/env";
import prisma from "./config/prisma";

function describeDatabaseBootstrapFailure(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("P1010") || msg.includes("denied access")) {
    return [
      "PostgreSQL refused the connection (Prisma P1010).",
      "Check: PostgreSQL is running; DB_HOST/DB_PORT; DB_USER exists; DB_NAME exists; DB_PASS matches DATABASE_URL password.",
      "If the role cannot connect: as a superuser run GRANT CONNECT ON DATABASE your_db TO your_user;",
    ].join(" ");
  }
  return msg;
}

async function start(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (err) {
    console.error("Database unavailable — API will not start.");
    console.error(describeDatabaseBootstrapFailure(err));
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log("Module scope active: Vitals and Appointments.");
  });
}

void start();
