import connectMongo from "@/libs/mongoose";
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import User from '@/models/User';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
    await connectMongo();
  const token = process.env.NODE_ENV === 'development' ? 
    await getToken({ req, secret })
    : await getToken({ req, secret, secureCookie: true });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: token.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json( user, { status: 200 });
}