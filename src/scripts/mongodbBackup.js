
import "../config/env.js";
import { createMongoDBBackup } from "../services/mongodbBackup.service.js";

const run = async () => {
  try {
    console.log("Manual MongoDB backup started");

    const result = await createMongoDBBackup();

    console.log("MongoDB backup completed successfully");
    console.log(`R2 key : ${result.key}`);
    console.log(`Size   : ${result.size} bytes`);

    process.exit(0);
  } catch (error) {
    console.error(`MongoDB backup failed: ${error.message}`);
    process.exit(1);
  }
};

run();
