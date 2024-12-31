import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req) {
  await connectMongo();
  const token = process.env.NODE_ENV === 'development' ? 
    await getToken({ req, secret })
    : await getToken({ req, secret, secureCookie: true });
    
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: token.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const locations = user.storage
    .filter(location => location !== null)
    .map(location => ({
      id: location._id,
      name: location.name,
    }));

  return NextResponse.json({ locations }, { status: 200 });
}