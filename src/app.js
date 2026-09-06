import express from "express";
import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import subjectRoutes from "./routes/subject.route.js"

const app = express();

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

export default app;