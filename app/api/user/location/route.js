import User from '../../../../models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from "@/libs/mongoose";

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  await connectMongo();
  const token = await getToken({ req, secret, secureCookie: true });
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
    const token = await getToken({ req, secret, secureCookie: true });
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  
    const email = token.email;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
  
      const location = user.storage;
      if (!location) {
        return NextResponse.json({ message: 'Location not found' }, { status: 404 });
      }
  
      return NextResponse.json({ location }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ message: 'Server error', error }, { status: 500 });
    }
  }

export async function PUT(req){
    await connectMongo();
    const token = process.env.NODE_ENV === 'development' ? 
    await getToken({ req, secret })
    : await getToken({ req, secret, secureCookie: true });
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const email = token.email;
    try {
    const { containerId, newLocationName } = await req.json();
    const user = await User.findOne({ email });
    if (user) {
      const locationIndex = user.storage.findIndex(loc => loc === containerId);
      if (locationIndex !== -1) {
        user.storage[containerId].name = newLocationName;
        await user.save();
      } else {
        return NextResponse.json({ message: 'Location not found' }, { status: 404 });
      }
    }
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ location: user.storage }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ message: 'Server error', error }, { status: 500 });
    }
}