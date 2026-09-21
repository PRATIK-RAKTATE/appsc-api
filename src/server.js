import "./config/env.js";
import "./workers/knowledgeChunk.worker.js";
import "./workers/readingProgress.worker.js";
import "./workers/currentAffairsRag.worker.js";
import "./workers/translation.worker.js"
import { startMongoDBBackupJob } from "./jobs/mongodbBackup.job.js";
import { scheduleExpiryCron } from "./jobs/expiryCron.js";

import app from "./app.js";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./services/socket.service.js";


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