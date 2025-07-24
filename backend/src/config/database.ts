import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("connected", () => {
      console.log("📡 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err: Error) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📡 Mongoose disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("📡 Mongoose connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;
