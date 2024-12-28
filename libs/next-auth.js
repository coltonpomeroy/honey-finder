import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import config from "@/config";
import connectMongo from "./mongo";
import nodemailer from "nodemailer";
import { customEmailTemplate } from "@/libs/customEmailTemplate";
import User from "@/models/User";

export const authOptions = {
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      // Follow the "Login with Google" tutorial to get your credentials
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          createdAt: new Date(),
        };
      },
    }),
    // Follow the "Login with Email" tutorial to set up your email server
    // Requires a MongoDB database. Set MONOGODB_URI env variable.
    ...(connectMongo
      ? [
        EmailProvider({
          server: {
            host: process.env.EMAIL_SERVER_HOST,
            port: process.env.EMAIL_SERVER_PORT,
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          },
          from: process.env.EMAIL_FROM,
          sendVerificationRequest: async ({ identifier: email, url, provider }) => {
            const { host } = new URL(url);
            const transport = nodemailer.createTransport(provider.server);
            const { text, html } = customEmailTemplate({ url, host, email });
    
            await transport.sendMail({
              to: email,
              from: provider.from,
              subject: `Sign in to ${host}`,
              text,
              html,
            });
          },
        }),
        ]
      : []),
  ],

  adapter: MongoDBAdapter(connectMongo),

  
  callbacks: {
    async signIn({ user }) {
      console.log({ SIGNIN_USER: user });
      
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          let existingUser = await User.findOne({ email: user.email })
            .maxTimeMS(60000) // 5 second timeout
            .exec();
    
          if (existingUser) {
            if (existingUser.firstLogin) {
              existingUser.firstLogin = false;
              await existingUser.save();
            }
          } else {
            const storage = [
              {
                name: "My Home",
                containers: [
                  { name: "Refrigerator", items: [] },
                  { name: "Pantry", items: [] },
                ],
              },
            ];
            existingUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              createdAt: user.createdAt,
              firstLogin: true,
              setupCompleted: false,
              storage,
            });
            await existingUser.save();
          }
          
          user.existingUser = existingUser;
          return true;
          
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount === maxRetries) {
            console.error('Max retries reached. Authentication failed.');
            return false;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      return false;
    },
    async jwt({ token, user, account }) {
      if (user?.existingUser) {
        const existingUser = user.existingUser;
        token.id = existingUser.id; // User ID from database
        token.email = existingUser.email; // Email for API calls if needed
        token.accessToken = account?.access_token; // OAuth access token if needed
        token.firstLogin = existingUser.firstLogin; // Track first login
        token.setupCompleted = existingUser.setupCompleted; // Track setup completion
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the token to the session
      if (session?.user) {
        session.user.id = token.id;
        session.user.accessToken = token.accessToken; // Optional, for frontend use
        session.user.firstLogin = token.firstLogin; // Track first login
        session.user.setupCompleted = token.setupCompleted; // Track setup completion
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};
