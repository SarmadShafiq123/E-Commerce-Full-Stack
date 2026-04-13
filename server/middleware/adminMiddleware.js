/**
 * adminOnly — legacy re-export of isAdmin for backward compatibility.
 * All admin routes already use protect → adminOnly chain.
 * Role is verified from DB (via protect), so JWT manipulation can't bypass this.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403);
  throw new Error('Access denied. Admin only.');
};

export default adminOnly;
