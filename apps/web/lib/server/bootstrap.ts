import { countStoredActuals, migrateDatabase, recomputeAlerts, seedDatabase } from "@demand-planner/db";

let bootstrapped = false;

export async function ensureAppBootstrap(): Promise<void> {
  if (bootstrapped) {
    return;
  }

  migrateDatabase();
  if (countStoredActuals() === 0) {
    await seedDatabase();
  }

  recomputeAlerts();

  bootstrapped = true;
}
