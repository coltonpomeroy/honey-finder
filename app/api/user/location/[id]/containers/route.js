import User from '@/models/User'; // Adjust the path to your User model
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req, { params }) {
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

  const { id } = params;
  const location = user.storage.id(id);
  if (!location) {
    return NextResponse.json({ message: 'Location not found' }, { status: 404 });
  }

  const containers = location.containers.map(container => ({
    id: container._id,
    name: container.name,
  }));

  return NextResponse.json({ containers }, { status: 200 });
}