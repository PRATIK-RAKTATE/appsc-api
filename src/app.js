import express from "express";
import { authRoutes } from "./modules/auth/routes/index.js";
import { bookRoutes } from "./modules/books/routes/index.js";
import {
  questionRoutes,
  subjectRoutes,
  subTopicRoutes,
  topicRoutes,
} from "./modules/question-bank/routes/index.js";
import {
  aiSettingRoutes,
  platformSettingRoutes,
} from "./modules/platform-settings/routes/index.js";
import { examRoutes, testRoutes } from "./modules/exams/routes/index.js";
import {
  adminCurrentAffairsRoutes,
  currentAffairsBookmarkRoutes,
  currentAffairsRoutes,
} from "./modules/current-affairs/routes/index.js";
import { videoRoutes } from "./modules/videos/routes/index.js";
import {
  paymentRoutes,
  razorpayWebhookController,
} from "./modules/payments/routes/index.js";
import { adminCourseRoutes } from "./modules/courses/routes/index.js";
import { adminUserRoutes } from "./modules/users/routes/index.js";
import { annotationRoutes } from "./modules/annotations/routes/index.js";
import { aiRoutes } from "./modules/ai-assistant/routes/index.js";
import { adminChatRoutes, chatRoutes } from "./modules/chat/routes/index.js";
import { adminMentorRoutes, mentorRoutes } from "./modules/mentors/routes/index.js";

const app = express();

// Razorpay signs the exact request bytes, so this route must precede express.json().
app.post("/api/webhooks/razorpay", express.raw({ type: "application/json" }), razorpayWebhookController);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/subtopics", subTopicRoutes);
app.use("/api/questions", questionRoutes);
app.use("/admin/settings", platformSettingRoutes);
app.use("/api/current-affairs", currentAffairsRoutes);

app.use("/api/tests", testRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/current-affairs", adminCurrentAffairsRoutes);
app.use("/api/annotations", annotationRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/current-affairs/bookmarks", currentAffairsBookmarkRoutes);
app.use("/admin/ai-settings", aiSettingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/chat", adminChatRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/admin/mentors", adminMentorRoutes);

export default app;
