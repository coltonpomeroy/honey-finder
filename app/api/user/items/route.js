import mongoose from 'mongoose';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  await connectMongo();

  // Extract the token from the Authorization header
  const authHeader = req.headers.get('Authorization');
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }

  // Validate the token
  const decodedToken = await getToken({ req, token, secret });

  console.log("Received token:", decodedToken);

  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }


  const user = await User.findOne({ email: decodedToken.email });

  console.log({ user })

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
              else: '$storage.items.expirationDate'
            }
          },
          locationId: '$storage._id',
          locationName: '$storage.name'
        }
      },
      {
        $sort: {
          expiration: 1
        }
      }
    ]);

    return userItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw new Error('Error fetching items');
  }
};