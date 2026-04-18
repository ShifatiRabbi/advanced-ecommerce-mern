import slugify from 'slugify';
import { Blog } from './blog.model.js';
import { cloudinary } from '../../config/cloudinary.js';

export const createPost = async (data, authorId) => {
  const slug = slugify(data.title, { lower: true, strict: true });
  const { coverImage: rawCover, ...rest } = data;
  const coverImage =
    rawCover?.url ? { url: rawCover.url, public_id: rawCover.public_id } : undefined;
  return Blog.create({
    ...rest,
    slug,
    author: authorId,
    publishedAt: data.isPublished ? new Date() : null,
    ...(coverImage && { coverImage }),
  });
};

export const getPosts = async ({ page = 1, limit = 10, published, category } = {}) => {
  const filter = {};
  if (published !== undefined) filter.isPublished = published === 'true';
  if (category) filter.category = category;
  const skip = (Number(page) - 1) * Number(limit);
  const [posts, total] = await Promise.all([
    Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).populate('author', 'name').lean(),
    Blog.countDocuments(filter),
  ]);
  return { posts, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } };
};

export const getPostBySlug = async (slug) => {
  const post = await Blog.findOne({ slug }).populate('author', 'name').lean();
  if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }
  return post;
};

export const updatePost = async (id, data) => {
  const prev = await Blog.findById(id);
  if (!prev) {
    const e = new Error('Post not found');
    e.status = 404;
    throw e;
  }
  const nextCover = data.coverImage?.url
    ? { url: data.coverImage.url, public_id: data.coverImage.public_id }
    : undefined;
  if (
    nextCover?.public_id &&
    prev.coverImage?.public_id &&
    nextCover.public_id !== prev.coverImage.public_id
  ) {
    await cloudinary.uploader.destroy(prev.coverImage.public_id).catch(() => {});
  }
  const payload = { ...data };
  if (nextCover) payload.coverImage = nextCover;
  return Blog.findByIdAndUpdate(
    id,
    { ...payload, ...(data.isPublished && !data.publishedAt && { publishedAt: new Date() }) },
    { new: true }
  );
};

export const deletePost = (id) => Blog.findByIdAndDelete(id);