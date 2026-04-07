import { CheckoutConfig } from './checkout.model.js';

const DEFAULT_FIELDS = [
  { id:'f1', name:'fullName',   label:'Full Name',     type:'text',     placeholder:'Your full name',   required:true,  isActive:true, width:'half', sortOrder:1 },
  { id:'f2', name:'phone',      label:'Phone Number',  type:'tel',      placeholder:'01XXXXXXXXX',      required:true,  isActive:true, width:'half', sortOrder:2 },
  { id:'f3', name:'email',      label:'Email Address', type:'email',    placeholder:'your@email.com',   required:false, isActive:true, width:'full', sortOrder:3 },
  { id:'f4', name:'address',    label:'Full Address',  type:'textarea', placeholder:'House, Road, Area',required:true,  isActive:true, width:'full', sortOrder:4 },
  { id:'f5', name:'city',       label:'City',          type:'text',     placeholder:'City',             required:true,  isActive:true, width:'half', sortOrder:5 },
  { id:'f6', name:'district',   label:'District',      type:'select',   placeholder:'',                 required:false, isActive:true, width:'half', sortOrder:6,
    options:['Dhaka','Chittagong','Rajshahi','Khulna','Sylhet','Barishal','Rangpur','Mymensingh','Comilla','Narayanganj','Gazipur'] },
  { id:'f7', name:'note',       label:'Order Note',    type:'textarea', placeholder:'Special instructions', required:false, isActive:true, width:'full', sortOrder:7 },
];

const DEFAULT_PAYMENT_METHODS = [
  { key:'cod',        label:'Cash on Delivery', isActive:true,  sortOrder:1, icon:'💵', note:'Pay when your order arrives' },
  { key:'bkash',      label:'bKash',            isActive:true,  sortOrder:2, icon:'📱', note:'bKash mobile banking' },
  { key:'sslcommerz', label:'Card / Online',    isActive:true,  sortOrder:3, icon:'💳', note:'Visa, Mastercard, mobile banking' },
];

export const getCheckoutConfig = async () => {
  let config = await CheckoutConfig.findOne().lean();
  if (!config) {
    config = await CheckoutConfig.create({ fields: DEFAULT_FIELDS, paymentMethods: DEFAULT_PAYMENT_METHODS });
  }
  return config;
};

export const updateCheckoutConfig = async (data) => {
  let config = await CheckoutConfig.findOne();
  if (!config) config = await CheckoutConfig.create(data);
  else { Object.assign(config, data); await config.save(); }
  return config;
};