import express from "express";
import dotenv from "dotenv";
import { createClient } from "redis";
import Session from "express-session";
import cors from "cors";
import { UserRouter } from "./routes/user.routes.js";
import { AuthRouter } from "./routes/auth.routes.js";
import PostRouter from "./routes/posts.routes.js";
import cookieParser from "cookie-parser";
import CommentRouter from "./routes/comments.routes.js";

const app = express();

dotenv.config();

app.use(express.urlencoded());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());

const client = createClient({
  password: process.env.PASSWORD,
  socket: {
    host: process.env.HOST,
    port: 10893,
  },
});

client.connect().then(() => {
  console.log("Redis is connected successfully");
});

app.use(
  Session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
``;

app.use("/api/v1/users", UserRouter);
app.use("/auth", AuthRouter);
app.use("/api/v1/posts", PostRouter);
app.use("/api/v1/comments", CommentRouter);

export { app, client };
