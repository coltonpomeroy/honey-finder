import connectMongo from "@/libs/mongoose";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import User from '@/models/User';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  await connectMongo();
  const token = await getToken({ req, secret });
  console.log({ token, req, secret })
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: token.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  try {
    const items = await getAllItemsForUser(user._id);
    if (!items) {
      return NextResponse.json({ message: 'Items not found' }, { status: 404 });
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}

const getAllItemsForUser = async (userId) => {
  try {
    const userItems = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$storage' },
      { $unwind: '$storage.containers' },
      { $unwind: '$storage.containers.items' },
      {
        $project: {
          _id: 0,
          item: '$storage.containers.items._id',
          name: '$storage.containers.items.name',
          quantity: '$storage.containers.items.quantity',
          expiration: '$storage.containers.items.expirationDate',
          locationId: '$storage._id',
          locationName: '$storage.name',
          containerId: '$storage.containers._id',
          container: '$storage.containers.name',
        },
      },
    ]);
    userItems.sort((a, b) => {
      if (!a.expiration) return 1;
      if (!b.expiration) return -1;
      return new Date(a.expiration) - new Date(b.expiration);
    });

    return userItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};