import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import mongoose from "mongoose";
import config from "@/config";
import connectMongo from "./mongo";
import nodemailer from "nodemailer";
import { customEmailTemplate } from "@/libs/customEmailTemplate";
import User from "@/models/User";
import clientPromise from "./mongo";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
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
    ...(connectMongo
      ? [
        EmailProvider({
          server: {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
            secure: false,
            debug: true,
            logger: true,
          },
          from: process.env.EMAIL_FROM,
          sendVerificationRequest: async ({ identifier: email, url, provider }) => {
            try {
              const transport = nodemailer.createTransport({
                ...provider.server,
                tls: {
                  ciphers: 'SSLv3',
                  rejectUnauthorized: false,
                },
              });
              await transport.verify();

              const { host } = new URL(url);
              const { text, html } = customEmailTemplate({ url, host, email });

              const result = await transport.sendMail({
                to: email,
                from: provider.from,
                subject: `Sign in to ${host}`,
                text,
                html,
              });

              console.log('Email sent successfully:', result);
            } catch (error) {
              console.error('Detailed email error:', {
                code: error.code,
                message: error.message,
                stack: error.stack,
              });
              throw error;
            }
          },
        }),
      ]
      : []),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async signIn({ user }) {
      const maxRetries = 3;
      let retryCount = 0;

      console.log("SIGN IN USER", user);

      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
      }
      let deviceType = 'desktop';


      while (retryCount < maxRetries) {
        try {
          let existingUser = await User.findOne({ email: user.email })
            .maxTimeMS(60000) // 5 second timeout
            .exec();

          if (existingUser) {
            existingUser.lastLogin = new Date();
            existingUser.deviceType = deviceType;
            await existingUser.save();
          } else {
            const storage = [
              {
                name: "Kitchen Pantry",
                items: []
              },
              {
                name: "Kitchen Fridge",
                items: []
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
              lastLogin: new Date()
            });
            await existingUser.save();
          }

          return true;
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;

          if (retryCount === maxRetries) {
            console.error('Max retries reached. Authentication failed.');
            return false;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        }
      }

      return false;
    },
    async jwt({ token, user, account }) {
      if (user?.existingUser) {
        const existingUser = user.existingUser;
        token.id = existingUser.id;
        token.email = existingUser.email;
        token.accessToken = account?.access_token;
        token.firstLogin = existingUser.firstLogin;
        token.setupCompleted = existingUser.setupCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.accessToken = token.accessToken;
        session.user.firstLogin = token.firstLogin;
        session.user.setupCompleted = token.setupCompleted;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logos/pantry-paul-logo.png`,
  },
};