import OpenAI from "openai";
const openai = new OpenAI();
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';

const secret = process.env.NEXTAUTH_SECRET;

export const getAllItemsForUser = async (userId) => {
  try {
    const userItems = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$storage' },
      { $unwind: '$storage.containers' },
      { $unwind: '$storage.containers.items' },
      {
        $project: {
          _id: 0,
          name: '$storage.containers.items.name',
          expirationDate: '$storage.containers.items.expirationDate',
          estimatedCost: '$storage.containers.items.estimatedCost',
        },
      },
    ]);

    return userItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export async function POST(req) {
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

  const allItems = await getAllItemsForUser(user._id);

  const prompt = `
You are an AI chef. Your goal is to create delicious and practical recipe ideas using the provided ingredients, prioritizing those that are expiring soon. Focus on the items that have recently expired or will expire in the next seven days and emphasize preventing food waste. Do your best to create a delicious meal. Based on the brand and item, do your best to estimate the value of the expired or soon to expire items used in the recipe. The value should never be $0.00.

### Expiring Soon (Next 3 Days)
${allItems.map(item => `- **${item.name}**\n  - Expiration Date: ${item.expirationDate}\n  - Estimated Cost: $${item.estimatedCost ? item.estimatedCost.toFixed(2) : 'N/A'}`).join("\n")}

Please generate 2-3 recipe ideas using these items, prioritizing the ones that will expire the soonest. Highlight the expiring ingredients as the stars of each dish and calculate the total cost savings. Provide the response in plain JSON format with consistent properties. Do not include any additional text or explanations.

Example JSON format: DO NOT USE MARKDOWN
[
  {
    "title": "Recipe Title",
    "ingredients": ["Ingredient 1", "Ingredient 2"],
    "instructions": ["Step 1", "Step 2"],
    "costSavings": "Total cost savings: $X.XX"
  }
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a creative AI chef focused on helping users reduce food waste by using ingredients that are about to expire. You should recommend recipes where the food items go together well. It is very important that you provide a costSavings for each recipe, which is your best guess at how much it would cost to replace the food about to expire. Use the brand name and item to determine the potential of each item that is set to expire soon or has recently expired. costSavings is the value of all ingredients used. IMPORTANT!! costSavings should always have a dollar and cents amount in the format of $x.xx....no other text. Also, next to any food about to expire within the next three days, append 'Expiring in {x} days'. Do not include any additional text or explanations. Only provide the JSON response." },
        { role: "user", content: prompt },
      ],
    });

    const responseContent = completion.choices[0].message.content;
    console.log('OpenAI response content:', responseContent); // Log the response content

    // Ensure the response is in plain JSON format
    const jsonResponse = JSON.parse(responseContent);
    console.log('Parsed JSON response:', jsonResponse); // Log the parsed JSON response

    return NextResponse.json({ data: jsonResponse }, { status: 201 });
  } catch (error) {
    console.error('Error during OpenAI API call or response parsing:', error); // Log the error
    if (error.code === 'insufficient_quota') {
      return NextResponse.json({ message: 'You have exceeded your current quota. Please check your plan and billing details.' }, { status: 429 });
    }
    return NextResponse.json({ message: 'Server error', error }, { status: 500 });
  }
}