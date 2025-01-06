import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  await connectMongo();

  const { idToken } = await req.json(); // Token sent from iOS app
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // Verify the token with Google
    const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload["email"]; // Google User Email

    // Check if user exists or create a new user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: payload["name"],
        email: payload["email"],
        image: payload["picture"],
        createdAt: new Date(),
        firstLogin: true,
        setupCompleted: false,
        storage: [
          { name: "Kitchen Pantry", items: [] },
          { name: "Kitchen Fridge", items: [] },
        ],
        lastLogin: new Date(),
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    // Optionally, create a NextAuth session or issue a custom JWT
    const token = await getToken({ req, secret });

    // Send a custom JWT or session info back
    return NextResponse.json({ token, userId: user._id });
  } catch (error) {
    console.error("Error verifying Google ID Token:", error);
    return NextResponse.json({ error: "Invalid idToken" }, { status: 401 });
  }
}