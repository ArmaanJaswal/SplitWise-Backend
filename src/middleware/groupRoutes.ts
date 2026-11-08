import express from "express"
import type { Request,Response } from "express";
import { authMiddleware } from "./authMiddleware";
import { db } from "../prisma/db";


const router = express.Router();


router.post("/createGroup",authMiddleware,async(req,res)=>{
    try{
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({message:"Please login first"});
        }
        const name = req.body?.name;
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Enter the group name" });
        }

        const group = await db.transaction(async(tx)=>{
            const created = await tx.orm.public.Group.create({name:name.trim()});
            await tx.orm.public.GroupMember.create({userId,groupId:created.id});
            return created;
        })

        return res.status(201).json({message:"Group created successfuly",groupId:group.id});

    }catch(err){
        console.log("Error while creating group",err);
        return res.status(500).json({message:"Internal Server Error"})
    }
})

router.get("/group",authMiddleware,async (req,res)=>{
    try{
        const userId = req.userId;
        if(!userId){
            return res.status(401).json({message:"Please login first"});
        }

        const memberships = await db.orm.public.GroupMember.where({userId}).include('group').all();

        const groups = memberships.map((membership)=>({
            id:membership.group.id,
            name:membership.group.name,
            joinedAt:membership.joinedAt
        }));

        return res.status(200).json({message:"Groups you have joined are",groups})
    }catch(err){
        console.log("Error while fetching groups",err);
        return res.status(500).json({message:"Internal Server Error"});
    }
})

export default router;