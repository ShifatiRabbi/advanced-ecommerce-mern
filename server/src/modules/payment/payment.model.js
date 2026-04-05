import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order:          { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    method:         { type: String, enum: ['sslcommerz', 'bkash', 'manual', 'cod'], required: true },
    status:         { type: String, enum: ['initiated', 'pending', 'paid', 'failed', 'cancelled', 'refunded'], default: 'initiated', index: true },
    amount:         { type: Number, required: true },
    currency:       { type: String, default: 'BDT' },
    transactionId:  { type: String, index: true },
    gatewayRef:     { type: String },
    gatewayResponse:{ type: mongoose.Schema.Types.Mixed },
    ipnPayload:     { type: mongoose.Schema.Types.Mixed },
    verifiedAt:     { type: Date },
    refundedAt:     { type: Date },
    refundAmount:   { type: Number },
    note:           { type: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);