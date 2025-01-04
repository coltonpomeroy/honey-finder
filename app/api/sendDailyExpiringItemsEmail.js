import mongoose from 'mongoose';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import User from '@/models/User'; // Adjust the path as needed

// Connect to MongoDB
const connectToDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  }
};

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

const sendEmail = async (email, items) => {
  const itemList = items.map(item => `<li>${item.name} (expires on ${item.expirationDate.toDateString()})</li>`).join('');
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'PantryPal: Items Expiring Soon',
    html: `
      <div style="text-align: center;">
        <img src="https://pantry-pal.com/logos/pantry-paul-logo.png" alt="PantryPal Logo" style="max-width: 200px; margin-bottom: 20px;" />
      </div>
      <p>The following items are expiring soon or have already expired:</p>
      <ul>${itemList}</ul>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://pantry-pal.com" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Don't let your food go to waste!</a>
      </div>
    `,
  };

  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
  }
};

const checkExpiringItems = async () => {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  try {
    await connectToDatabase();
    const users = await User.find().populate('storage.items');
    for (const user of users) {
      const expiringItems = [];
      for (const location of user.storage) {
        for (const item of location.items) {
          const expirationDate = new Date(item.expirationDate);
          if (expirationDate <= threeDaysFromNow) {
            expiringItems.push(item);
          }
        }
      }

      if (expiringItems.length > 0) {
        await sendEmail(user.email, expiringItems);
      }
    }
  } catch (error) {
    console.error('Error checking expiring items:', error);
  }
};

export default async function handler(req, res) {
  await checkExpiringItems();
  res.status(200).json({ message: 'Checked expiring items and sent emails if necessary.' });
}