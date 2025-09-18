import mongoose, { Schema, Document } from 'mongoose';

export type AreaType = 'city' | 'zipcode' | 'polygon';

export interface IArea extends Document {
  name: string;
  type: AreaType;
  value?: string | string[];
  polygon?: Array<{ lat: number; lng: number }>;
}

const AreaSchema = new Schema<IArea>({
  name: { type: String, required: true },
  type: { type: String, enum: ['city', 'zipcode', 'polygon'], required: true },
  value: { type: Schema.Types.Mixed, required: false },
  polygon: [{ lat: Number, lng: Number }]
});

export default mongoose.model<IArea>('Area', AreaSchema); 