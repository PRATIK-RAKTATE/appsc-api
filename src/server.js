import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";


const port = process.env.PORT || 5000 ;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
          console.log(`server is running on this port ${port}`);
        });

    } catch (error) {
        console.error("server start faild ", error);
        process.exit(1);
    }
};

startServer();
