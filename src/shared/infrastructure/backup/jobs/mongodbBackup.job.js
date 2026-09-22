import cron from "node-cron";

import { createMongoDBBackup } from "../services/mongodbBackup.service.js";

export const startMongoDBBackupJob = () => {
  const schedule =
    process.env.BACKUP_CRON_SCHEDULE ||
    "0 2 * * *";

  if (!cron.validate(schedule)) {
    throw new Error(
      `Invalid BACKUP_CRON_SCHEDULE: ${schedule}`
    );
  }

  const task = cron.schedule(
    schedule,
    async () => {
      try {
        console.log(
          "Starting scheduled MongoDB backup..."
        );

        await createMongoDBBackup();

        console.log(
          "Scheduled MongoDB backup completed"
        );
      } catch (error) {
        console.error(
          `Scheduled MongoDB backup failed: ${error.message}`
        );
      }
    },
    {
      timezone:
        process.env.BACKUP_CRON_TIMEZONE ||
        "UTC",
    }
  );

  console.log(
    `MongoDB backup cron scheduled: ${schedule}`
  );

  return task;
};