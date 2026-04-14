export const asyncHandler = (handler) => {
  return async (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
