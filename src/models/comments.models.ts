import mongoose from "mongoose";
import { Post } from "./posts.models.js";

interface Icomment extends Document {
  

  title: string;
   user : mongoose.Types.ObjectId
  post :mongoose.Types.ObjectId
  mainComment?:mongoose.Types.ObjectId


}


const CommentSchema  : mongoose.Schema<Icomment> = new mongoose.Schema({

  title: {
    type: String,
    required: true,
 
  },


post : {
  type : mongoose.Schema.Types.ObjectId,

},

user:{
  type : mongoose.Schema.Types.ObjectId,
}
, mainComment :
// if someone had replied to the comment , the main id will be there
{
  type : mongoose.Schema.Types.ObjectId,


}


}, {
  timestamps: true,
})


const Comment = mongoose.model<Icomment>("Comment", CommentSchema);

export { Comment };