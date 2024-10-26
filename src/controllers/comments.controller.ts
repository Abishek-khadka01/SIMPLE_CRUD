import { Request, Response } from "express";
import { Comment } from "../models/comments.models.js";
import { StatusCode } from "../utils/StatusCode.js";
import { Post } from "../models/posts.models.js";
export async function createComment(req: Request, res: Response) {
  try {
    const { id } = req.params; // get the post id from the query
    const { message } = req.body;
    const { user } = req;
    const { mainComment } = req.body;
    let newComment = await Comment.create({
      title: message,
      user: user?._id,
      post: id,
      mainComment,
    });
    if (!mainComment) {
      newComment.mainComment = newComment._id;
    }

    await Post.findByIdAndUpdate(id, {
      $push: { comments: newComment._id },
    })
    res.status(200).json({ comment: newComment });
  } catch (error) {
    console.log("error while creating the comment", error);
  }
}
