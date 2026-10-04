import assert from "node:assert/strict";
import test from "node:test";
import { contactSchema, contentSchema } from "../../lib/validation.ts";

test("accepts a publishable project",()=>{const result=contentSchema.safeParse({type:"project",slug:"frame-by-frame",title:"Frame by Frame",status:"published",excerpt:"A film.",body:"Story",data:{},featured:true,sortOrder:0});assert.equal(result.success,true)});
test("rejects unsafe slugs",()=>{const result=contentSchema.safeParse({type:"page",slug:"../admin",title:"Unsafe",data:{}});assert.equal(result.success,false)});
test("rejects page slugs reserved by public routes",()=>{const result=contentSchema.safeParse({type:"page",slug:"about",title:"Another about page",data:{}});assert.equal(result.success,false)});
test("rejects contact spam honeypot and malformed email",()=>{const result=contactSchema.safeParse({name:"Bot",email:"not-an-email",projectType:"Film",message:"Long enough message",website:"spam.example"});assert.equal(result.success,false)});
