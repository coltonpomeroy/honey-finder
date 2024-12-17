import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req, { params }) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: token.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const { name, quantity, expirationDate } = await req.json();
  const { id, containerId } = params;
  const container = user.storage.id(id).containers.id(containerId);
  if (!container) {
    return NextResponse.json({ message: 'Container not found' }, { status: 404 });
  }

  container.items.push({ name, quantity, expirationDate });
  await user.save();

  return NextResponse.json({ message: 'Item added successfully' }, { status: 201 });
}