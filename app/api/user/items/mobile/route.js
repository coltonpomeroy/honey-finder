import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyIdToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_ID_OS,
  });
  const payload = ticket.getPayload();
  return payload; // Contains user info like email, sub (user ID), etc.
}

export async function GET(req) {
  await connectMongo();

  console.log({ headers: req.headers });

  // Extract the token from the Authorization header
  const authHeader = req.headers.get('authorization');
  console.log({ authHeader });
  
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }

  console.log({ tokenFromHeader: token });

  // Validate the token using Google OAuth2 client
  let decodedToken;
  try {
    decodedToken = await verifyIdToken(token);
    console.log("Decoded token:", decodedToken);
  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: decodedToken.email });

  console.log({ user });

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
    console.error("Error fetching items:", error);
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
}