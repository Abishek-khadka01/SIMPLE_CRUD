import qs from "qs";
import axios from "axios";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { Request, Response, NextFunction } from "express";
import { GoogleOAuthResponse, Userdetails } from "../types/types.js";
import { StatusCode } from "../utils/StatusCode.js";
import { client } from "../app.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { createOtp } from "../utils/CreateOtp.js";
import { IUser } from "../models/user.models.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import fs, { rm, rmSync } from "fs";
import { main } from "../utils/nodemailer.js";

interface DecodedTokenType {
  email: string;
  name: string;
  picture: string;
  sub: string;
}
export const oauthHandler = async (req: Request, res: Response) => {
  try {
    // get the code from the qs
    const code: string = req.query.code as string;
    console.log(`Code is ${code}`);

    // get the id and access token from the code
    const { id_token, access_token } = await getGoogleOauthtokens(code);

    console.log(`id_token = ${id_token} \n access_token = ${access_token}`);
    // get the user with tokens
    const decodedTokens = await jwt.decode(id_token);
    const { email, name, picture, sub } = decodedTokens as DecodedTokenType;
    console.log(email, name, picture, sub);
    let accessToken: string, refreshToken: string;
    // create a session
    const user = await User.findOne({ email });
    if (user) {
      const decoded = await createAccessTokensandRefreshTokens(
        user._id as mongoose.Types.ObjectId
      );
      if (decoded) {
        accessToken = decoded.accessToken;
        refreshToken = decoded.refreshToken;
        user.RefreshToken = refreshToken;
        await user.save();
      } else {
        throw new ApiError(
          StatusCode.InternalServerError,
          "Failed to create access and refresh tokens"
        );
      }

      client.set("id_token", id_token, {
        EX: 180,
      });
      client.set("refreshToken", refreshToken, {
        EX: 1296000,
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect(`http://localhost:3000/dashboard?code:${decodedTokens}`);
    } else {
      const user = User.create({
        username: name,
        email,
        Loggedbygoogle: true,
        Google_id: sub,
      });
      console.log("User created successfully", user);

      let accessToken: string, refreshToken: string;
      const decoded = await createAccessTokensandRefreshTokens(
        (
          await user
        )._id as mongoose.Types.ObjectId
      );
      if (decoded) {
        accessToken = decoded.accessToken;
        refreshToken = decoded.refreshToken;
      } else {
        throw new ApiError(
          StatusCode.InternalServerError,
          "Failed to create access and refresh tokens"
        );
      }

      client.set("id_token", id_token, {
        EX: 180,
      });
      client.set("refreshToken", refreshToken, {
        EX: 1296000,
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect(`http://localhost:3000/dashboard?code:${decodedTokens}`);
    }
  } catch (error) {
    console.log(error);
  }
};

export async function getGoogleOauthtokens(
  code: string
): Promise<GoogleOAuthResponse> {
  const url = "https://oauth2.googleapis.com/token"; // fixed URL
  console.log(code);

  const values = {
    code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URL,
    grant_type: "authorization_code",
  };

  console.log(values);
  console.log("stringify", qs.stringify(values));

  try {
    const res = await axios.post(url, qs.stringify(values), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log(res.data);

    const {
      access_token,
      expires_in,
      refresh_token,
      scope,
      token_type,
      id_token,
    } = res.data;
    return { access_token, expires_in, token_type, id_token };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve Google OAuth tokens");
  }
}

type createAccessTokensandRefreshTokens = {
  accessToken: string;
  refreshToken: string;
};

const createAccessTokensandRefreshTokens = async function (
  id: mongoose.Types.ObjectId
): Promise<createAccessTokensandRefreshTokens | undefined> {
  try {
    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(StatusCode.NotFound, "User not found");
    }

    const refreshToken = await user.createRefreshToken();
    const accessToken = await user.createAccessToken();

    // Return the tokens as an object
    return { refreshToken, accessToken };
  } catch (error) {
    console.log("Error while creating access tokens and refresh tokens", error);
    // Optionally return undefined in case of an error, or rethrow
    return undefined;
  }
};

export const getdetails = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    throw new ApiError(
      StatusCode.BadRequest,
      "username, email and password are required"
    );
  }
  const user = await User.findOne({ email });
  if (user) {
    throw new ApiError(StatusCode.BadRequest, "User Already Exists");
  }

  const otp = createOtp();
  console.log(otp);

  client.set("otp", otp, {
    EX: 180,
  });

  await main(email, otp);

  const tempuser: Userdetails = {
    username,
    email,
    password,
  };

  client.set("userdetails", JSON.stringify(tempuser), {
    EX: 300,
  });

  res.status(StatusCode.Ok).json({
    error: false,
    message: "OTP sent successfully",
  });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const otpfromredis = await client.get("otp");
    console.log(otpfromredis);
    const userdetails = await client.get("userdetails");
    console.log(userdetails);

    if (!userdetails) {
      res.status(StatusCode.BadRequest).json({
        error: true,
        message: "Re - register , request timeout",
      });
    }
    if (otp != otpfromredis) {
      res.status(StatusCode.BadRequest).json({
        error: true,
        message: "Invalid OTP",
      });
    } else {
      const decode = JSON.parse(userdetails as string);
      console.log(decode);
      const { username, password, email } = decode;
      const user = User.create({
        username,
        password,
        email,
        Loggedbygoogle: false,
      });
      client.del("userdetails");
      client.del("otp");
      res.status(StatusCode.Ok).json({
        error: false,
        message: "OTP verified successfully ,Login now",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const login = async function (req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(StatusCode.BadRequest).json({
        error: true,
        message: "Enter both the username and password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(StatusCode.NotFound, "User not found");
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new ApiError(StatusCode.BadRequest, "Invalid Password");
    } else {
      const decoded = await createAccessTokensandRefreshTokens(
        user._id as mongoose.Types.ObjectId
      );

      let accessToken: string, refreshToken: string;
      if (!decoded) {
        throw new ApiError(
          StatusCode.InternalServerError,
          "Failed to create access and refresh tokens"
        );
      }
      accessToken = decoded.accessToken;
      refreshToken = decoded.refreshToken;

      user.RefreshToken = refreshToken;
      await user.save();
      client.set("refreshToken", refreshToken, {
        EX: 60 * 60 * 24 * 15,
      });
      res
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 1000 * 60 * 15,
        })
        .status(StatusCode.Ok)
        .json({
          error: false,
          message: "Login successful",
          user,
        });
    }
  } catch (error) {
    console.log("Error while login", error);
  }
};

export const RegenerateRefreshTokens = async function (
  req: Request,
  res: Response
) {
  try {
    const user = req.user as IUser;
    console.log(user);

    if (!user) {
      //check for the refresh tokens
      const refreshToken = await client.get("refreshToken");

      if (!refreshToken) {
        throw new ApiError(StatusCode.Forbidden, "Login again , timeout ");
      }

      const istrue = await jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      );

      if (!istrue) {
        throw new ApiError(StatusCode.Forbidden, "Login again , timeout ");
      }

      const user = await User.findOne({ RefreshToken: refreshToken });

      const accessToken = await user?.createAccessToken();

      res
        .cookie("accessToken ", accessToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 1000 * 60 * 15,
        })
        .status(StatusCode.Ok)
        .json({
          error: false,
          message: "the access token generated successfully",
        });
    } else {
      res.status(StatusCode.Ok).json({
        error: false,
        message: "the token already exists",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const resendOtp = async function (req: Request, res: Response) {
  try {
    const decodetoken = await client.get("userdetails");
    if (!decodetoken) {
      throw new ApiError(
        StatusCode.BadRequest,
        "Re - register , request timeout"
      );
    }

    const userdetails = JSON.parse(decodetoken as string);

    const email = userdetails.isEmail;

    // make the set timeout in the frontend so that the user cannot request for the otp time to time before 3 minutes

    const otp = createOtp();
    console.log(otp);
    client.set("otp", otp, {
      EX: 180,
    });

    // send the mail to the user
    await main(email, otp);

    res.status(StatusCode.Ok).json({
      error: false,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("Error while resending otp", error);
  }
};

export const uploadPhoto = async function (req: Request, res: Response) {
  try {
    const user = req.user as IUser;
    if (!user) {
      throw new ApiError(StatusCode.BadRequest, "User not found");
    }

    const photo = req.file;
    console.log(photo);

    if (!photo) {
      throw new ApiError(StatusCode.BadRequest, "Photo not found");
    }

    // upload the photo to the cloudinary
    const path = await uploadonCloudinary(photo.path as string);

    if (!path) {
      throw new ApiError(StatusCode.BadRequest, "Photo not uploaded");
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        picture: path,
      },
    });

    // removing the photo from the server

    fs.rmSync(photo.path as string);
    res.status(StatusCode.Ok).json({
      error: false,
      message: "Photo uploaded successfully",
      user,
    });
  } catch (error) {
    console.log("Error while uploading photo", error);
  }
};

export async function gettheuser(req: Request<UserParams>, res: Response) {
  try {
    const id: string = req.params.id as string;
    let user: IUser | null = null;

    // Check if the provided id is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Fetch user by ObjectId
      user = await User.findById(id);
    } else {
      // Fetch user by username (assuming id is a username in this case)
      user = await User.findOne({ username: id }).select(
        "username email posts picture"
      );
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Populate the 'posts' field
    const fullinformation = await user.populate("posts");

    return res.status(200).json({ user: fullinformation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

interface UserParams {
  id: string;
}
