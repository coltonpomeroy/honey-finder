import mongoose from "mongoose";

// ITEM SCHEMA
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  expirationDate: { type: Date },
  image: { type: String },
}, { _id: true, timestamps: true });

// STORAGE LOCATION SCHEMA
const storageLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [itemSchema],
}, { _id: true });

// USER SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
    },
    image: {
      type: String,
    },
    expoPushToken:{
      type: String,
    },
    customerId: {
      type: String,
      validate(value) {
        return value.includes("cus_");
      },
    },
    priceId: {
      type: String,
      validate(value) {
        return value.includes("price_");
      },
    },
    hasAccess: {
      type: Boolean,
      default: false,
    },
    storage: [storageLocationSchema],
    setupCompleted: {
      type: Boolean,
      default: true,
    },
    firstLogin: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    deviceType: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
// userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);