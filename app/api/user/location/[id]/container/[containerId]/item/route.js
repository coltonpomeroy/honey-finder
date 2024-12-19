import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req, { params }) {
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

  const { name, quantity, expirationDate } = await req.json();
  const { id, containerId } = params;
  const location = user.storage.id(id);
  if (!location) {
    return NextResponse.json({ message: 'Location not found' }, { status: 404 });
  }

  const container = location.containers.id(containerId);
  if (!container) {
    return NextResponse.json({ message: 'Container not found' }, { status: 404 });
  }

  const newItem = { name, quantity, expirationDate };
  container.items.push(newItem);
  await user.save();

  const createdItem = container.items[container.items.length - 1];

  const responseItem = {
    item: createdItem._id,
    name: createdItem.name,
    quantity: createdItem.quantity,
    expiration: createdItem.expirationDate,
    locationId: location._id,
    locationName: location.name,
    containerId: container._id,
    container: container.name,
  };

  return NextResponse.json(responseItem, { status: 201 });
}