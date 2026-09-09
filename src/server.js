import "./config/env.js";
import "./workers/knowledgeChunk.worker.js";
import { startMongoDBBackupJob } from "./jobs/mongodbBackup.job.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import "./workers/readingProgress.worker.js";


const PORT = process.env.PORT || 5000;

startMongoDBBackupJob();

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();