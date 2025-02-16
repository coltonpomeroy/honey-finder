import mongoose from 'mongoose';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import jwt from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET;

export async function PATCH(req, { params }) {
  await connectMongo();
  const authHeader = req.headers.get('x_authorization');
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }

  // Validate the token
  const decodedToken = authHeader ? jwt.verify(token, secret) : await getToken({ req, token, secret })

  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, itemId } = params;
  const { name, quantity, expirationDate, image } = await req.json();

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email: token.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const location = user.storage.id(id);
    if (!location) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    const item = location.items.id(itemId);
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (expirationDate !== undefined) item.expirationDate = expirationDate;
    if (image !== undefined) item.image = image;

    await user.save();

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectMongo();
  const authHeader = req.headers.get('x_authorization');
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }

  // Validate the token
  const decodedToken = authHeader ? jwt.verify(token, secret) : await getToken({ req, token, secret })

  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id, itemId } = params;

  console.log({ id, itemId });

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
    return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const location = user.storage.id(id);
    if (!location) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    const itemIndex = location.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    location.items.splice(itemIndex, 1);
    await user.save();

    return NextResponse.json({ message: 'Item deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}