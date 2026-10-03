import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { restoreVersion,versionsFor } from "@/lib/cms";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const admin=await requireAdminApi();if(!admin)return NextResponse.json({success:false},{status:401});const {id}=await params;return NextResponse.json({success:true,data:await versionsFor(id)})}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const admin=await requireAdminApi();if(!admin)return NextResponse.json({success:false},{status:401});const {id}=await params;const body=await request.json() as {version:number};const data=await restoreVersion(id,Number(body.version),admin.userId);return data?NextResponse.json({success:true,data}):NextResponse.json({success:false,error:{code:"VERSION_NOT_FOUND",message:"Version could not be found."}},{status:404})}
