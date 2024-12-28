import connectMongo from "@/libs/mongoose";
import { NextResponse } from 'next/server';

export async function GET() {
  try {  
  await connectMongo();
    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}
