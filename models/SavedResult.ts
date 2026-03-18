import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISavedResult extends Document {
  userId: Types.ObjectId;
  semester: string;
  totalStudents: number;
  resultsData: Record<string, unknown>[];
  excelData?: Buffer;
  excelFileName: string;
  excelFileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedResultSchema = new Schema<ISavedResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    totalStudents: {
      type: Number,
      required: true,
      default: 0,
    },
    resultsData: {
      type: [{ type: Schema.Types.Mixed }],
      required: true,
      default: [],
    },
    excelData: {
      type: Buffer,
      required: false,
    },
    excelFileUrl: {
      type: String,
      required: false,
    },
    excelFileName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

SavedResultSchema.index({ userId: 1, createdAt: -1 });

const SavedResult: Model<ISavedResult> =
  mongoose.models.SavedResult ||
  mongoose.model<ISavedResult>("SavedResult", SavedResultSchema);

export default SavedResult;
