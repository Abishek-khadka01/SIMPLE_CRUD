import { Router } from "express";
import { createComment } from "../controllers/comments.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const CommentRouter = Router();


CommentRouter.use(auth);
CommentRouter.post("/createComment/:id", createComment)




export default CommentRouter