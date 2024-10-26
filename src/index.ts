import mongoose from "mongoose";
import { app } from "./app.js";

const connectdb = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    await mongoose.connect("mongodb://localhost:27017", {
      dbName: "social_media",
    });

    app.listen(PORT, () => {
      console.log("server is running on port ", PORT);
    });
  } catch (error) {
    console.log("Error while connecting to database", error);
  }
};

connectdb();
