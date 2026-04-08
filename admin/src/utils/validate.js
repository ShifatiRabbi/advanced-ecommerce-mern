export const required = (val, label = 'This field') =>
  (!val && val !== 0 && val !== false) ? `${label} is required` : null;

export const minLen = (val, n, label = 'This field') =>
  (val?.length < n) ? `${label} must be at least ${n} characters` : null;

export const maxLen = (val, n, label = 'This field') =>
  (val?.length > n) ? `${label} must be at most ${n} characters` : null;

export const isEmail = (val) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Invalid email address';

export const isBdPhone = (val) =>
  /^(?:\+?88)?01[3-9]\d{8}$/.test(val?.replace(/\s/g,'')) ? null : 'Invalid Bangladesh phone number';

export const isNum = (val, label = 'This field') =>
  isNaN(Number(val)) ? `${label} must be a number` : null;

export const min = (val, n, label = 'This field') =>
  (Number(val) < n) ? `${label} must be at least ${n}` : null;

export const max = (val, n, label = 'This field') =>
  (Number(val) > n) ? `${label} must be at most ${n}` : null;

// Run array of validators, return first error or null
export const validate = (val, ...fns) => {
  for (const fn of fns) { const err = fn(val); if (err) return err; }
  return null;
};

// Run object schema validation, return { errors, isValid }
export const validateSchema = (data, schema) => {
  const errors = {};
  for (const [field, validators] of Object.entries(schema)) {
    const err = validators.map(fn => fn(data[field])).find(Boolean);
    if (err) errors[field] = err;
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};