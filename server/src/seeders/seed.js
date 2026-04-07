import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../modules/user/user.model.js';
import { Category } from '../modules/category/category.model.js';
import { Brand } from '../modules/brand/brand.model.js';
import { Product } from '../modules/product/product.model.js';
import { Page } from '../modules/page/page.model.js';
import { DeliveryZone } from '../modules/delivery/delivery.model.js';
import { seedDefaultTemplates } from '../modules/email/emailTemplate.service.js';

import dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  await User.deleteMany({});
  await Category.deleteMany({});
  await Brand.deleteMany({});
  await Product.deleteMany({});
  await Page.deleteMany({});
  await DeliveryZone.deleteMany({});

  console.log('Cleared existing data.');

  // ── Users ───────────────────────────────────────────────────────────────
  const adminPass  = await bcrypt.hash('admin', 12);
  const userPass   = await bcrypt.hash('user1', 12);

  const [adminUser, regularUser] = await User.insertMany([
    {
      name: 'Super Admin',
      email: 'admin@gmail.com',
      password: adminPass,
      role: 'admin',
      isActive: true,
    },
    {
      name: 'Test User',
      email: 'user1@gmail.com',
      password: userPass,
      role: 'customer',
      isActive: true,
    },
  ]);
  console.log(`Users seeded: ${adminUser.email}, ${regularUser.email}`);

  // ── Categories ──────────────────────────────────────────────────────────
  const categories = await Category.insertMany([
    { name: 'Electronics',  slug: 'electronics',  description: 'Gadgets and devices',        isActive: true },
    { name: 'Clothing',     slug: 'clothing',      description: 'Fashion and apparel',         isActive: true },
    { name: 'Books',        slug: 'books',         description: 'All kinds of books',          isActive: true },
    { name: 'Home & Living',slug: 'home-living',   description: 'Furniture and home decor',    isActive: true },
  ]);
  console.log(`Categories seeded: ${categories.length}`);

  // ── Brands ──────────────────────────────────────────────────────────────
  const brands = await Brand.insertMany([
    { name: 'Samsung',  slug: 'samsung',  isActive: true },
    { name: 'Apple',    slug: 'apple',    isActive: true },
    { name: 'Nike',     slug: 'nike',     isActive: true },
    { name: 'Penguin',  slug: 'penguin',  isActive: true },
  ]);
  console.log(`Brands seeded: ${brands.length}`);

  // ── Products ─────────────────────────────────────────────────────────────
  await Product.insertMany([
    {
      name: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      description: 'Flagship Android smartphone with AI features.',
      price: 79999,
      discountPrice: 74999,
      category: categories[0]._id,
      brand: brands[0]._id,
      stock: 50,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', public_id: 'sample' }],
      tags: ['smartphone', 'android', 'samsung'],
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Apple iPhone 15',
      slug: 'apple-iphone-15',
      description: 'Apple iPhone 15 with Dynamic Island and USB-C.',
      price: 99999,
      discountPrice: 94999,
      category: categories[0]._id,
      brand: brands[1]._id,
      stock: 30,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', public_id: 'sample' }],
      tags: ['smartphone', 'ios', 'apple'],
      isActive: true,
      isFeatured: true,
    },
    {
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      description: 'Comfortable running shoes with Max Air cushioning.',
      price: 8999,
      discountPrice: 7499,
      category: categories[1]._id,
      brand: brands[2]._id,
      stock: 100,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', public_id: 'sample' }],
      tags: ['shoes', 'running', 'nike'],
      isActive: true,
      isFeatured: false,
    },
    {
      name: 'Atomic Habits',
      slug: 'atomic-habits',
      description: 'James Clear\'s bestselling book on building good habits.',
      price: 699,
      discountPrice: 549,
      category: categories[2]._id,
      brand: brands[3]._id,
      stock: 200,
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', public_id: 'sample' }],
      tags: ['book', 'self-help', 'habits'],
      isActive: true,
      isFeatured: true,
    },
  ]);
  console.log('Products seeded: 4');

  await Page.insertMany([
    { key:'about',   title:'About Us', content:'<h2>About Our Store</h2><p>We are a leading eCommerce platform in Bangladesh.</p>', isActive:true },
    { key:'privacy', title:'Privacy Policy', content:'<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>', isActive:true },
    { key:'terms',   title:'Terms & Conditions', content:'<h2>Terms & Conditions</h2><p>By using our site...</p>', isActive:true },
    { key:'contact', title:'Contact Us', extra:{ phone:'01700-000000', email:'support@shopbd.com', address:'Dhaka, Bangladesh', mapEmbed:'', socials:{ facebook:'', instagram:'', youtube:'' } }, content:'Get in touch with us anytime.', isActive:true },
  ]);
  
  await DeliveryZone.insertMany([
    { zone:'Inside Dhaka',  areas:['Dhaka City','Mirpur','Dhanmondi','Gulshan','Banani','Uttara','Motijheel'], charge:60,  minDays:1, maxDays:2, isActive:true },
    { zone:'Outside Dhaka', areas:['Chittagong','Rajshahi','Sylhet','Khulna','Barishal','Rangpur'],            charge:120, minDays:2, maxDays:5, isActive:true },
    { zone:'Sub-districts', areas:[],                                                                          charge:150, minDays:3, maxDays:7, isActive:true },
  ]);
  await seedDefaultTemplates();
  console.log('Email templates seeded');

  console.log('\n✅ Seed complete!');
  console.log('   Admin  → admin@gmail.com  / admin');
  console.log('   User   → user1@gmail.com  / user1');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});