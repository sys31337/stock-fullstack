import { model, Schema } from 'mongoose';

const customersSchema = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  address: String,
  phoneNumber: String,
  email: String,
  wilaya: String,
  hasWhatsapp: {
    type: Boolean,
    default: false
  },
  rc: String,
  nif: String,
  nis: String,
  ai: String,
  nar: String,
  town: String,
  city: String,
  debts: {
    type: Number,
    default: 0
  },
  credit: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['Client', 'Supplier'],
    default: 'Client'
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, { timestamps: true });

const Customer = model('Customer', customersSchema);
export default Customer;
