import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

async function verifyAccessToken(token) {
  const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
  if (!response.ok) {
    throw new Error('Invalid access token');
  }
  const payload = await response.json();
  return payload; // Contains user info like email, sub (user ID), etc.
}

export async function POST(req) {
  await connectMongo();

  const { accessToken } = await req.json();
  if (!accessToken) {
    return NextResponse.json({ message: 'Access token is required' }, { status: 400 });
  }

  let decodedToken;
  try {
    decodedToken = await verifyAccessToken(accessToken);
    console.log('Decoded token:', decodedToken);
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let user = await User.findOne({ email: decodedToken.email });

  if (!user) {
    // If the user does not exist, create a new user
    user = new User({
      name: decodedToken.name,
      email: decodedToken.email,
      image: decodedToken.picture,
      createdAt: new Date(),
      lastLogin: new Date(),
    });
    await user.save();
  } else {
    // Update the last login time for the existing user
    user.lastLogin = new Date();
    await user.save();
  }

  // Generate a JWT for the authenticated user
  const token = jwt.sign(
    { email: decodedToken.email, id: user._id },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: '1h' }
  );

  return NextResponse.json({ token }, { status: 200 });
}