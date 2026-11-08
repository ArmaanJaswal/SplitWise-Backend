import "dotenv/config"
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from './routes/authRoutes'

const app = express();

app.use(cookieParser());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("Hello World")
})

app.use("/api/v1/auth",authRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`App is running on port ${process.env.PORT}`)
})