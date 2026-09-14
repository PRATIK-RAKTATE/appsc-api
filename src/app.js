import express from "express";
import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import subTopicRoutes from "./routes/subTopic.routes.js";
import questionRoutes from "./routes/question.routes.js";
import platformSettingRoutes from "./routes/platformSetting.routes.js";

import testRoutes from "./routes/test.routes.js";
import currentAffairsRoutes from "./routes/currentAffairs.routes.js";
import videoRoutes from "./routes/video.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { razorpayWebhookController } from "./controllers/payment.controller.js";
import adminCourseRoutes from "./routes/adminCourse.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";

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

export default app;
