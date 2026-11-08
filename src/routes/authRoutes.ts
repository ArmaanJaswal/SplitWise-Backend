import express from "express"
import type { Request,Response } from "express";
import { db } from "../prisma/db";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import JWT_SECRET from "../config/env";
import { stringToToken } from "typescript/unstable/ast";
import cookieParser from "cookie-parser";

const router = express.Router();

interface SignUpData{
    email:string,
    password:string,
    name:string
}

interface LoginData{
    email:string,
    password:string
}

interface getMeData{
    token:string
}

router.post("/signup",async (req:Request<{},{},SignUpData>,res:Response)=>{
    try{
        const {email,password,name} = req.body;
        if(!email || !password || !name){
            return res.status(400).json({message:"Invalid Input, Enter all the fields"})
        }

        const foundEmail = await db.orm.public.User
        .where({email})
        .first()

        if(foundEmail){
            return res.status(409).json({message:"User already Exists"})
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const createdUser = await db.orm.public.User.create({
            email,
            password:hashedPassword,
            name
        })

        return res.status(201).json({message:"User Registered Successfully"})

    }catch(err){
        console.log("Error while Signing Up");
        res.status(500).json({message:"Internal Server Error"})
    }
})


router.post("/login",async (req:Request<{},{},LoginData>,res:Response)=>{
    try{
        const {email,password}= req.body;

        if(!email || !password){
            return res.status(400).json({message:"Invalid Input, Enter all the fields"})
        }

        const userExists = await db.orm.public.User
        .where({email})
        .first()

        if(!userExists){
            return res.status(404).json({message:"User Not Found, Please Sign Up"});
        }

        const passwordMatch = await bcrypt.compare(password,userExists.password);

        if(!passwordMatch){
            return res.status(400).json({message:"Invalid Credentials"});
        }


        const token = jwt.sign({userId:userExists.id},JWT_SECRET,{expiresIn:'1d'});

        res.cookie('auth-token',token,{
            httpOnly:true,
            sameSite:'strict',
            maxAge:24*60*60*1000
        })
        

        return res.status(200).json({message:"User LoggedIn successfully"});
    }catch(error){
        console.log("Error while logging in ",error);
        return res.status(500).json({message:"Internal Server Error"})
    }
})


router.get("/me",async(req:Request<{},{},getMeData>,res:Response)=>{
    try{
        const token = req.headers.authorization?.split(" ")[1];

        if(!token){
            return res.status(401).json({message:"Token Missing"});
        }

        let decoded: {userId:number};
        try{
            decoded= jwt.verify(token,JWT_SECRET) as {userId:number};
        }catch{
            return res.status(401).json({message:"Invalid or Expired Token"});
        }

        const userDetails = await db.orm.public.User
        .where({id:decoded.userId})
        .first()

        if(!userDetails){
            return res.status(404).json({message:"User does not exist"});
        }


        return res.status(200).json({message:"User details found ",id:userDetails.id,name:userDetails.name, email:userDetails.email})


    }catch(err){
        console.log("Error while fetching current user",err);
        return res.status(500).json({message:"Internal Server Error"});
    }
})

export default router;