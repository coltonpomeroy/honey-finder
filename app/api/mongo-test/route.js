import connectMongo from "@/libs/mongoose";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await connectMongo();
    const isConnected = db.connections[0].readyState === 1;
    
    return NextResponse.json({ 
      status: 200, 
      connected: isConnected,
      readyState: db.connections[0].readyState 
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json({ 
      message: 'Server error', 
      error: error.toString() 
    }, { status: 500 });
  }
}