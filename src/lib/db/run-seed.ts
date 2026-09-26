import { seedDatabase } from "./seed";

async function main() {
  try {
    await seedDatabase();
    console.log("Seeding finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed database:", err);
    process.exit(1);
  }
}

main();
