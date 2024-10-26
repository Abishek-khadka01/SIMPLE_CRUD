import { Router } from "express";
import {
  getdetails,
  login,
  RegenerateRefreshTokens,
  registerUser,
  resendOtp,
  gettheuser,
  uploadPhoto

} from "../controllers/users.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";
import { User } from "../models/user.models.js";
import {upload} from "../middlewares//multer.middleware.js";
const UserRouter = Router();
// api/v1/users




UserRouter.post("/register", getdetails);
UserRouter.post("/verify-otp", registerUser);
UserRouter.get("/login", login);
UserRouter.get("/resend-otp", resendOtp);
UserRouter.post("/generate-refreshtoken", auth, RegenerateRefreshTokens);
// UserRouter.get("/:id", auth , gettheuser);
UserRouter.post("/upload-photo", auth,upload.single("profile"), uploadPhoto)


export { UserRouter };
