import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// ITEM SCHEMA
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  expirationDate: { type: Date },
  image: { type: String },
}, { _id: false });

// CONTAINER SCHEMA
const containerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [itemSchema],
}, { _id: false });

// STORAGE LOCATION SCHEMA
const storageLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  containers: [containerSchema],
}, { _id: false });

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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

export default mongoose.models.User || mongoose.model("User", userSchema);