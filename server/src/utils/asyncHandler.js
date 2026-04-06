export const asyncHandler = (fn) => (req, res, next) => {
  console.log('Executing function:', fn.name); // This will tell you which controller is running
  console.log('Next is a function?', typeof next === 'function');
  Promise.resolve(fn(req, res, next)).catch(next);
};