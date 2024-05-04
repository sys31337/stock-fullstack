import { model, Schema } from 'mongoose';
import { IUser } from '@api/types/IUser';

const usersSchema = new Schema<IUser>({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  fullname: String,
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'default.png',
  },
  isMainAccount: {
    type: Boolean,
    default: false,
    unique: true,
  },
  type: {
    type: String,
    enum: ['USER', 'VENDOR'],
    default: 'USER'
  },
  permissions: [String],
  refreshToken: String,
}, { timestamps: true });

const User = model<IUser>('User', usersSchema);
export default User;
