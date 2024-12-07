import User from '../../../../models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { location } = await req.json();
  const email = token.email;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    user.storage.push(location);
    await user.save();
    return NextResponse.json({ location: user.storage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}

export async function GET(req) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const email = token.email;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ location: user.storage }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}