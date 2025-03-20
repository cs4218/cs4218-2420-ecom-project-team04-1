import dotenv from "dotenv";
import colors from "colors";
import connectDB from "./config/db.js";
import app from './app.js';

// Configure env
dotenv.config();

// Database config
connectDB();

const PORT = process.env.PORT || 6060;

const server = app.listen(PORT, () => {
    console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
});

export default server;
