import { User } from '../user/user.model.js';

const PERMISSIONS = {
  admin:    ['*'],
  manager:  ['orders:read', 'orders:write', 'products:read', 'products:write', 'customers:read', 'inventory:write'],
  support:  ['orders:read', 'customers:read', 'orders:write'],
  content:  ['products:read', 'products:write', 'blog:write'],
};

export const listEmployees = () =>
  User.find({ role: { $in: ['admin', 'employee'] } })
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .lean();

export const createEmployee = async ({ name, email, password, role, permissions }) => {
  const exists = await User.findOne({ email });
  if (exists) { const e = new Error('Email already registered'); e.status = 409; throw e; }
  return User.create({ name, email, password, role: 'employee', permissions: permissions || PERMISSIONS[role] || [], isActive: true });
};

export const updateEmployee = async (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true }).select('-password -refreshToken');

export const toggleEmployeeStatus = async (id) => {
  const emp = await User.findById(id);
  if (!emp) { const e = new Error('Employee not found'); e.status = 404; throw e; }
  emp.isActive = !emp.isActive;
  return emp.save();
};

export const getPermissionTemplates = () => PERMISSIONS;