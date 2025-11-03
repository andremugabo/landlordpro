// middleware/verifyManagerAccess.js
/**
 * Universal middleware to verify manager access to property-linked entities
 * @param {object} options
 *   - model: Sequelize model of the entity (e.g., Floor, Lease, Tenant)
 *   - propertyKey: name of the property foreign key in the model (default: 'property_id')
 *   - paramId: source of entity id, either 'params' or 'body' (default: 'params')
 *   - idField: name of entity id field in params/body (default: 'id')
 */

module.exports = function verifyManagerAccess(options) {
  const { model, propertyKey = 'property_id', paramId = 'params', idField = 'id' } = options;

  return async (req, res, next) => {
    try {
      const user = req.user;
      const entityId = req[paramId][idField];

      if (!entityId) {
        return res.status(400).json({ message: 'Entity ID is required' });
      }

      // Admin can access everything
      if (user.role === 'admin') return next();

      // Manager can only access entities linked to their assigned property
      if (user.role === 'manager') {
        const entity = await model.findOne({
          where: { id: entityId },
          include: {
            model: require('../models').Property,
            as: 'property',
            where: { manager_id: user.id },
          },
        });

        if (!entity) {
          return res.status(403).json({
            message: 'Access denied: You are not assigned to this property.',
          });
        }
      }

      // Employees cannot access
      if (user.role === 'employee') {
        return res.status(403).json({ message: 'Access restricted to managers or admins.' });
      }

      next();
    } catch (err) {
      console.error('Manager access check failed:', err);
      res.status(500).json({ message: 'Internal server error while verifying access.' });
    }
  };
};
