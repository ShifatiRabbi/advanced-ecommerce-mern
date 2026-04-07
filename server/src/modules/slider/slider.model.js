import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  type:         { type: String, enum: ['image','text','mixed'], default: 'mixed' },
  imageUrl:     { type: String, default: '' },
  heading:      { type: String, default: '' },
  subheading:   { type: String, default: '' },
  buttonLabel:  { type: String, default: '' },
  buttonUrl:    { type: String, default: '' },
  buttonStyle:  { type: String, default: 'primary' },
  bgColor:      { type: String, default: '#111827' },
  textColor:    { type: String, default: '#ffffff' },
  align:        { type: String, enum: ['left','center','right'], default: 'center' },
  overlay:      { type: Number, default: 40 },
}, { _id: false });

const sliderSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  slides:        [slideSchema],
  position:      { type: String, enum: ['hero','after-hero','middle','before-footer','custom'], default: 'hero' },
  showOnPages:   [{ type: String }],
  autoPlay:      { type: Boolean, default: true },
  interval:      { type: Number, default: 4000 },
  showDots:      { type: Boolean, default: true },
  showArrows:    { type: Boolean, default: true },
  height:        { type: String, default: '480px' },
  isActive:      { type: Boolean, default: true },
  sortOrder:     { type: Number, default: 0 },
}, { timestamps: true });

export const Slider = mongoose.model('Slider', sliderSchema);