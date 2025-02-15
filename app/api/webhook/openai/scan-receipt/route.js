import { NextResponse } from 'next/server';
import connectMongo from '@/libs/mongoose';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';
import sharp from 'sharp';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  await connectMongo();

  const form = formidable({ uploadDir: './uploads', keepExtensions: true });

  const buffers = [];
  for await (const chunk of req.body) {
    buffers.push(chunk);
  }
  const buffer = Buffer.concat(buffers);
  const stream = Readable.from(buffer);

  // Manually set the content-type and content-length headers
  stream.headers = {
    'content-type': req.headers.get('content-type'),
    'content-length': buffer.length,
  };

  return new Promise((resolve, reject) => {
    form.parse(stream, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return resolve(NextResponse.json({ message: 'Error parsing form data', err }, { status: 500 }));
      }

      console.log('Parsed files:', files);

      if (!files.image || !files.image[0].filepath) {
        return resolve(NextResponse.json({ message: 'No image file uploaded or file path is missing' }, { status: 400 }));
      }

      const imagePath = files.image[0].filepath;

      try {
        if (!fs.existsSync(imagePath)) {
          throw new Error(`File not found: ${imagePath}`);
        }

        // Compress the image using sharp
        const compressedImageBuffer = await sharp(imagePath)
          .resize(800) // Resize to 800px width, maintaining aspect ratio
          .jpeg({ quality: 80 }) // Compress to 80% quality
          .toBuffer();

        const base64Image = compressedImageBuffer.toString('base64');
        const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

        const prompt = `
          You are an AI assistant. I will provide you with an image of a receipt. 
          Your task is to scan the receipt, determine the store, parse out the items that seem to be food items, 
          and return only a JSON array of objects. Each object should have the following properties:
          - name: string (the name of the food item, use full words, no abbreviations)
          - quantity: number (default to 1 if not specified)
          - expirationDate: string (ISO date format, estimated based on the type of food product and the current date ${currentDate})
          - image: string (base64 encoded image of the item, optional)
          Use the SKUs on the receipt as well as the item names to get clues about the items.
          If the receipt is from Walmart, use the lookup tool at https://www.walmart.com/receipt-lookup to get more information about the items.
          Please return only the JSON array without any additional text or formatting.
          IMPORTANT: YOUR RESPONSE MUST RETURN VALID JSON. Do not include backticks or the word 'json' in the response.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: "auto" } }
              ]
            }
          ],
          max_tokens: 300
        });

        const responseContent = completion.choices[0].message.content.trim();

        console.log('OpenAI response content:', responseContent);

        // Ensure the response is valid JSON
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseContent);
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          return resolve(NextResponse.json({ message: 'Error parsing JSON response', error: jsonError }, { status: 500 }));
        }

        return resolve(NextResponse.json({ data: parsedResponse }, { status: 200 }));
      } catch (error) {
        console.error('Error processing image:', error);
        return resolve(NextResponse.json({ message: 'Error processing image', error }, { status: 500 }));
      } finally {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Clean up the uploaded file
        }
      }
    });
  });
}