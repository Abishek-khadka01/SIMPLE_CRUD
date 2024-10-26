import {
  createPost,
  deletePost,
  getthePost,
  LikeCounter,
} from "../controllers/Posts.controller.js";

import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {upload } from  "../middlewares/multer.middleware.js"

const PostRouter = Router();
 PostRouter.use(auth)
PostRouter.post("/create-post",upload.array("photo"), createPost);
PostRouter.get("/getthePost/:id", getthePost);
PostRouter.post("/LikeCounter", LikeCounter);
PostRouter.delete("/deletePost/:id", deletePost);


export default PostRouter;
