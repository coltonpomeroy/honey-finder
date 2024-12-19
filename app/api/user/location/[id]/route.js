import mongoose from 'mongoose';
import User from '../../../../../models/User'; // Adjust the path to your User model
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

const getLocationById = async (locationId) => {
  try {
    const userWithLocation = await User.findOne({
      'storage._id': new mongoose.Types.ObjectId(locationId),
    }, {
      'storage.$': 1, // Use projection to retrieve only the relevant storage
    });

    if (!userWithLocation) {
      console.log('Location not found');
      return null;
    }

    // Locate the specific storage location
    const location = userWithLocation.storage.find(storageLocation => storageLocation._id.toString() === locationId);

    if (!location) {
      console.log('Location not found');
      return null;
    }

    console.log('Location found:', location);
    return location;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
};

export async function GET(req,params) {
  await connectMongo();
  const token = await getToken({ req, secret, secureCookie: true  });
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
  }

  try {
    const location = await getLocationById(id);
    if (!location) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ location }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}