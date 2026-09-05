import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const translationQueue = new Queue("translation", {
  connection: redisConnection,
});