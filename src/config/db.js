import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.DATABASE_URI);
        console.log(`mongoDB connect successfully, ${connection.connection.host}`);
        
    } catch (error) {
        console.log("mongoDB connection faild " , error.message);
        process.exit(1);
    }
}

export default connectDB;