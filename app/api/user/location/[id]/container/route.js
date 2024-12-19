import mongoose from 'mongoose';
import User from '../../../../../../models/User'; // Adjust the path to your User model
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req, { params }) {
  await connectMongo();
  const token = process.env.NODE_ENV === 'development' ? 
  await getToken({ req, secret })
  : await getToken({ req, secret, secureCookie: true });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  const { id } = params; // Get id from route parameters

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

    // Add the new container to the location's containers array
    location.containers.push({ name, items: [] });
    await user.save();

    // Fetch the updated location to ensure the response is accurate
    const updatedLocation = user.storage.id(id);

    return NextResponse.json({ location: updatedLocation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}