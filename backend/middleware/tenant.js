// Resolves which restaurant_id every request should be scoped to.
//
// - restaurant_admin / waiter: always locked to their own restaurant_id from the JWT.
//   They can never read or write another restaurant's data, even if they guess an id.
// - super_admin: manages the platform, not a single restaurant. They may pass
//   ?restaurant_id=123 to operate on a specific restaurant (e.g. support/setup tasks).
function resolveTenant(req, res, next) {
  if (req.user.role === 'super_admin') {
    const fromQuery = req.query.restaurant_id || req.body.restaurant_id;
    req.restaurantId = fromQuery ? parseInt(fromQuery, 10) : null;
    return next();
  }

  if (!req.user.restaurantId) {
    return res.status(403).json({ error: 'Account is not linked to a restaurant.' });
  }
  req.restaurantId = req.user.restaurantId;
  next();
}

// Use on routes that must have a concrete restaurant in scope (blocks bare super_admin calls
// that didn't supply ?restaurant_id=)
function requireTenant(req, res, next) {
  if (!req.restaurantId) {
    return res.status(400).json({ error: 'restaurant_id is required for this request.' });
  }
  next();
}

module.exports = { resolveTenant, requireTenant };
