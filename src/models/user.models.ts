import mongoose, { Document, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError";
import { StatusCode } from "../utils/StatusCode";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password?: string;
  email: string;
  Loggedbygoogle: boolean;
  posts?: mongoose.Types.ObjectId[];
  RefreshToken?: string;
  GoogleID?: string;
  picture?: string;

  comparePassword(password: string): Promise<boolean>;
  createAccessToken(): Promise<string>;
  createRefreshToken(): Promise<string>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (email: string) => validator.isEmail(email),
        message: "Invalid email address",
      },
    },
    Loggedbygoogle: {
      type: Boolean,
      required: true,
    },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    RefreshToken: {
      type: String,
    },
    GoogleID: {
      type: String, // Changed from Number to String as Google IDs are typically strings
    },
    picture: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Define methods BEFORE creating the model
userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.createAccessToken = async function (): Promise<string> {
  return jwt.sign(
    { _id: this._id },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.createRefreshToken = async function (): Promise<string> {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
  try {
    // Check if password is required but missing
    if (!this.password && !this.Loggedbygoogle) {
      throw new ApiError(StatusCode.Forbidden, "Password is required");
    }

    // Only hash password if it's been modified
    if (this.password && this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create and export the model
const User = mongoose.model<IUser>("User", userSchema);
export { User };