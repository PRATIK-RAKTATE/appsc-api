import "./config/env.js";
import "./modules/books/workers/knowledgeChunk.worker.js";
import "./modules/books/workers/readingProgress.worker.js";
import "./modules/current-affairs/workers/currentAffairsRag.worker.js";
import { startMongoDBBackupJob } from "./shared/infrastructure/backup/jobs/mongodbBackup.job.js";
import { scheduleExpiryCron } from "./modules/entitlements/index.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./modules/chat/index.js";


const PORT = process.env.PORT || 5000;

startMongoDBBackupJob();
scheduleExpiryCron();

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    registerSocketHandlers(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
