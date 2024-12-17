import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req, {params}) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id, containerId } = params;
  const { name, quantity, expirationDate } = await req.json();

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(containerId)) {
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

    const container = location.containers.id(containerId);
    if (!container) {
      return NextResponse.json({ message: 'Container not found' }, { status: 404 });
    }

    container.items.push({ name, quantity, expirationDate });
    await user.save();

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}