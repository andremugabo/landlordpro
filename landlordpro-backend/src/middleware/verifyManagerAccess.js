// middleware/verifyManagerAccess.js
/**
 * Universal middleware to verify manager access to property-linked entities
 * @param {object} options
 *   - model: Sequelize model of the entity (e.g., Floor, Lease, Tenant)
 *   - propertyKey: name of the property foreign key in the model (default: 'property_id')
 *   - propertyAlias: association alias used when including Property (default: 'property')
 *   - paramId: source of entity id, either 'params' or 'body' (default: 'params')
 *   - idField: name of entity id field in params/body (default: 'id')
 */

module.exports = function verifyManagerAccess(options) {
  const {
    model,
    propertyKey = 'property_id',
    propertyAlias = 'property',
    paramId = 'params',
    idField = 'id',
  } = options;

  return async (req, res, next) => {
    try {
      const user = req.user;
      const entityId = req[paramId][idField];

      if (!entityId) {
        return res.status(400).json({ message: 'Entity ID is required' });
      }

      // Admins bypass access checks
      if (user.role === 'admin') return next();

      if (user.role === 'manager') {
        const includeConfig = propertyAlias
          ? {
              model: require('../models').Property,
              as: propertyAlias,
              where: { manager_id: user.id },
              attributes: ['id', 'manager_id'],
            }
          : null;

        const entity = await model.findOne({
          where: { id: entityId },
          include: includeConfig ? [includeConfig] : undefined,
          attributes: ['id', propertyKey],
        });

        if (!entity) {
          return res.status(403).json({
            message: 'Access denied: You are not assigned to this property.',
          });
        }
      }

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
