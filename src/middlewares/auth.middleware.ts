import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { StatusCode } from "../utils/StatusCode.js";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.models.js";
import { client } from "../app.js";
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accesstoken =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.cookies.accessToken;
    console.log(accesstoken);

    const refreshtoken = await client.get("refreshToken");
    if (!accesstoken) {
      req.user = undefined;
    } else {
      const decoded = (await jwt.verify(
        accesstoken,
        process.env.ACCESS_TOKEN_SECRET as string
      )) as IUser; // Cast to IUser

      // Assign the decoded user to req.user
      req.user = decoded;
    }

    next();
  } catch (error) {
    console.log("Error while getting the details from the token", error);
    next(new ApiError(StatusCode.Unauthorized, "Unauthorized"));
  }
};

export { auth };
