import express from 'express'
import type { Request,Response,NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import JWT_SECRET from '../config/env'


const authMiddleware =(req:Request,res:Response,next:NextFunction)=>{
    try{
        const token = req.cookies?.["auth-token"];
        
        if(!token){
            return res.status(401).json({message:"Please login first"});
        }
    const decoded = jwt.verify(token,JWT_SECRET);


    if(typeof decoded === "string"){
        return res.status(401).json({message:"Invalid Token"});
    }
    const userId = decoded.userId;
    req.userId = userId;

    next();
    }catch(err){
        console.log("Error in authMiddleware",err);
        return res.status(401).json({message:"Invalid or Expired Token"});
    }


}