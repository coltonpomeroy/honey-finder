import mongoose from 'mongoose';
import User from '../../../../../models/User'; // Adjust the path to your User model
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = req.query;
  const { name, items } = await req.json();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ 'storage._id': id });
    if (!user) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    const location = user.storage.id(id);
    if (!location) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    location.containers.push({ name, items });
    await user.save();

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}