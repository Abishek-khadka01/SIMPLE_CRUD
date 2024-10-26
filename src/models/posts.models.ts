import mongoose, { Schema } from "mongoose";

interface Post extends Document {
  title: string;
  description: string;
  comments: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  photo?: string
}

const PostSchema: Schema<Post> = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      
    },

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    photo:{
      type: String,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId
      }
    ],
  },

  {
    timestamps: true,
  }
);

const Post = mongoose.model<Post>("Post", PostSchema);
export { Post };
