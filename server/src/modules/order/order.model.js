import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  phone:     { type: String, required: true },
  email:     { type: String },
  address:   { type: String, required: true },
  city:      { type: String, required: true },
  district:  { type: String },
  zip:       { type: String },
  note:      { type: String },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:           { type: String, required: true },
  slug:           { type: String },
  image:          { type: String },
  unitPrice:      { type: Number, required: true },     // ← Use unitPrice (consistent with frontend)
  qty:            { type: Number, required: true, min: 1 },
  total:          { type: Number, required: true },
  variant:        { type: String, default: null },
  variantDetails: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber:     { type: String, unique: true },
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items:           [orderItemSchema],
    shippingAddress: addressSchema,
    subtotal:        { type: Number, required: true },
    shippingCharge:  { type: Number, default: 60 },
    discount:        { type: Number, default: 0 },
    total:           { type: Number, required: true },
    paymentMethod:   { type: String, enum: ['cod', 'bkash', 'sslcommerz', 'manual'], default: 'cod' },
    paymentStatus:   { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    status: {
      type: String,
      enum: ['incomplete', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'fake'],
      default: 'incomplete',
      index: true,
    },
    isFake:          { type: Boolean, default: false },
    fakeReason:      { type: String },
    couponCode:      { type: String },
    ip:              { type: String },
    userAgent:       { type: String },
    sessionId:       { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'shippingAddress.phone': 1 });
orderSchema.index({ 'shippingAddress.email': 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ isFake: 1 });

orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
});

export const Order = mongoose.model('Order', orderSchema);