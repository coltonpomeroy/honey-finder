import mongoose from 'mongoose';
import User from '@/models/User'; // Adjust the path to your User model
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function PUT(req, { params }) {
  await connectMongo();
  const token = process.env.NODE_ENV === 'development' ? 
  await getToken({ req, secret })
  : await getToken({ req, secret, secureCookie: true });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  const { id, containerId } = params; // Get id and containerId from route parameters

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

    container.name = name;
    await user.save();

    return NextResponse.json({ container }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectMongo();

  const token = process.env.NODE_ENV === 'development' ? 
  await getToken({ req, secret })
  : await getToken({ req, secret, secureCookie: true });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, containerId } = params; // Get id and containerId from route parameters

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

    location.containers.pull({ _id: containerId });

    await user.save();
    const updatedContainers = location.containers;

    return NextResponse.json({ message: 'Container deleted successfully', containers: updatedContainers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error: ', error }, { status: 500 });
  }
}