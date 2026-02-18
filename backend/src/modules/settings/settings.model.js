import mongoose from "mongoose";

const { Schema } = mongoose;

// Key-value settings store
// e.g. { key: "company_name", value: "KB Aviation", category: "general" }
const SettingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    value: {
      type: Schema.Types.Mixed,
      required: true,
    },

    category: {
      type: String,
      default: "general",
      index: true,
    },

    description: String,
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", SettingSchema);

export default Setting;
