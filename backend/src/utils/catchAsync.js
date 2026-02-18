/**
 * Wraps an async controller function to catch errors automatically.
 * No need for try/catch in every controller — just wrap it with catchAsync.
 *
 * Usage:
 *   export const getUsers = catchAsync(async (req, res) => {
 *     const users = await User.find();
 *     res.json({ status: "success", data: users });
 *   });
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
