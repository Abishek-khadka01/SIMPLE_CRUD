import { Router } from "express";
const AuthRouter = Router();
import { oauthHandler } from "../controllers/users.controllers.js";

AuthRouter.get("/google", oauthHandler);

export { AuthRouter };
