import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { StatusCode } from "../utils/StatusCode";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { Post } from "../models/posts.models.js";
import mongoose from "mongoose";

export async function createPost(req: Request, res: Response): Promise<any> {
  try {
    const { user } = req;
    const title = req.body.title;
    const description = req.body.description;
    const files = req.files as Express.Multer.File[]; // Assume multiple files

    // Check if title is provided
    if (!title) {
      throw new ApiError(StatusCode.BadRequest, "Title is required");
    }

    let photoUrls: string[] = [];

    // Handle multiple photo uploads if provided
    if (files && files.length > 0) {
      for (const file of files) {
        const url = (await uploadonCloudinary(file.path as string)) as string;
        photoUrls.push(url);
      }
    }
    console.log(description);
    // Create the post
    const post = await Post.create({
      title,
      description,
      photos: photoUrls.length > 0 ? photoUrls : null,
      user: user?._id,
    });

    // Ensure user.posts is initialized
    await User.findByIdAndUpdate(user?._id, {
      $push: { posts: post._id },
    });
    // Populate comments and likes in the post
    // const updatedPost = await post.populate("comments likes");

    // Return response
    return res.status(200).json({ photos: photoUrls, post: post });
  } catch (error) {
    console.error("Error while creating post", error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the post", error });
  }
}

export async function LikeCounter(req: Request, res: Response) {
  try {
    const { user } = req;

    const id = req.query.id; // get the post id from the query
    const post = await Post.findById(id);
    if (!post) {
      throw new ApiError(StatusCode.NotFound, "Post not found");
    }

    if (post.likes.includes(user?._id as mongoose.Types.ObjectId)) {
      return;
    } else {
      post.likes.push(user?._id as mongoose.Types.ObjectId);
      await post.save();
    }

    res.status(200).json({ post: post.populate("comments likes") });
  } catch (error) {
    console.log("error while creating the post counter", error);
  }
}

export async function deletePost(req: Request, res: Response): Promise<any> {
  try {
    const { user } = req;
    const { id } = req.params; // get the post id from the query

    // Validate the ID
    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
      return res
        .status(StatusCode.BadRequest)
        .json({ message: "Invalid or missing post ID" });
    }

    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res
        .status(StatusCode.NotFound)
        .json({ message: "Post not found" });
    }

    const updateUser = await User.findByIdAndUpdate(user?._id, {
      $pull: { posts: id },
    });

    res.status(StatusCode.Ok).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error while deleting the post:", error);
    res
      .status(StatusCode.InternalServerError)
      .json({ message: "Internal server error" });
  }
}

export async function getthePost(req: Request, res: Response) {
  try {
    const { user } = req;
    const { id } = req.params; // get the post id from the query
    if (!user) {
      throw new ApiError(StatusCode.BadRequest, "user not found");
    }

    const post = await Post.findById(id);
    if (!post) {
      throw new ApiError(StatusCode.NotFound, "Post not found");
    }
    if (post.likes == null || post.comments == null) {
      res.status(StatusCode.Ok).json({ post, error: false });
    } else {
      res.status(StatusCode.Ok).json({ post: post.populate("comments likes") });
    }
  } catch (error) {
    console.log("error while getting the post", error);
  }
}
