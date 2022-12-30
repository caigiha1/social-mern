import express from "express";
import { EventEmitter } from "events";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
EventEmitter.defaultMaxListeners = 15;

// File Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Routes with file
app.post("/auth/register", upload.single("picture", register));
app.post("/post", verifyToken, upload.single("picture"), createPost);

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/post", postRoutes);

// Mongoose setup
const PORT = process.env.PORT || 6001;
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port : ${PORT}`));

    // Add data one time
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
