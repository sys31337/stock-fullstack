import { model, Schema } from 'mongoose';

const suppliersSchema = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  address: String,
  phoneNumber: String,
  email: String,
  rc: String,
  nif: String,
  nar: String,
  debts: {
    type: Number,
    default: 0
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, { timestamps: true });

const Supplier = model('Supplier', suppliersSchema);
export default Supplier;
