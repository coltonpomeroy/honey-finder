import mongoose from 'mongoose';
import User from '@/models/User'; // Adjust the path to your User model
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function DELETE(req, { params }) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: token.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const { id, containerId, itemId } = params;
  const location = user.storage.id(id);
  if (!location) {
    return NextResponse.json({ message: 'Location not found' }, { status: 404 });
  }

  const container = location.containers.id(containerId);
  if (!container) {
    return NextResponse.json({ message: 'Container not found' }, { status: 404 });
  }

  const item = container.items.id(itemId);
  if (!item) {
    return NextResponse.json({ message: 'Item not found' }, { status: 404 });
  }

  container.items.pull({ _id: itemId });
  await user.save();

  return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
}

export async function PUT(req, { params }) {
  await connectMongo();
  const token = await getToken({ req, secret });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findOne({ email: token.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const { id, containerId, itemId } = params;
  const { name, quantity, expirationDate } = await req.json();
  const location = user.storage.id(id);
  if (!location) {
    return NextResponse.json({ message: 'Location not found' }, { status: 404 });
  }

  const container = location.containers.id(containerId);
  if (!container) {
    return NextResponse.json({ message: 'Container not found' }, { status: 404 });
  }

  const item = container.items.id(itemId);
  if (!item) {
    return NextResponse.json({ message: 'Item not found' }, { status: 404 });
  }

  item.name = name;
  item.quantity = quantity;
  item.expirationDate = expirationDate;
  await user.save();

  const updatedItem = {
    item: item._id,
    name: item.name,
    quantity: item.quantity,
    expiration: item.expirationDate,
    locationId: location._id,
    locationName: location.name,
    containerId: container._id,
    container: container.name,
  };

  return NextResponse.json(updatedItem, { status: 200 });
}