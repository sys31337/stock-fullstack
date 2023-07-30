import { model, Schema } from 'mongoose';

const usersSchema = new Schema({
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  refreshToken: String,
}, { timestamps: true });

const User = model('User', usersSchema);
export default User;
