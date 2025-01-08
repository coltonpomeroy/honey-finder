import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';

export async function POST(req) {
  await connectMongo();

  console.log({ headers: req.headers });

  // Extract email from the request body
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  // Check if the user exists in the database
  const user = await User.findOne({ email });

  console.log({ user });

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // Fetch the items for the authenticated user
  try {
    const items = await getAllItemsForUser(user._id);
    if (!items) {
      return NextResponse.json({ message: 'Items not found' }, { status: 404 });
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ message: 'Error fetching items' }, { status: 500 });
  }
}

async function getAllItemsForUser(userId) {
  try {
    const userItems = await User.aggregate([
      { $match: { _id: userId } },
      { $unwind: '$storage' },
      { $unwind: '$storage.items' },
      {
        $project: {
          _id: 0,
          item: '$storage.items._id',
          name: '$storage.items.name',
          quantity: '$storage.items.quantity',
          expiration: {
            $cond: {
              if: { $eq: ['$storage.items.expirationDate', null] },
              then: new Date('9999-12-31'),
              else: '$storage.items.expirationDate',
            },
          },
          locationId: '$storage._id',
          locationName: '$storage.name',
        },
      },
      {
        $sort: {
          expiration: 1,
        },
      },
    ]);

    return userItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw new Error('Error fetching items');
  }
}