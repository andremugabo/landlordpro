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

      console.log('verifyManagerAccess:', { 
        role: user.role, 
        entityId, 
        model: model.name 
      });

      if (!entityId) {
        return res.status(400).json({ 
          success: false,
          message: 'Entity ID is required' 
        });
      }

      // ✅ Admins bypass access checks
      if (user.role === 'admin') {
        console.log('Admin access granted, bypassing checks');
        return next();
      }

      // ✅ Employees don't have access
      if (user.role === 'employee') {
        console.log('Employee access denied');
        return res.status(403).json({ 
          success: false,
          message: 'Access restricted to managers or admins.' 
        });
      }

      // ✅ Manager access validation
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

        console.log('Manager validation result:', { 
          entityFound: !!entity,
          entityId,
          managerId: user.id 
        });

        if (!entity) {
          console.log('Manager access denied: entity not found or not assigned');
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not assigned to this property.',
          });
        }

        // ✅ CRITICAL FIX: Call next() when manager validation succeeds!
        console.log('Manager access granted');
        return next();
      }

      // ✅ Unknown role - deny by default
      console.log('Unknown role, access denied');
      return res.status(403).json({ 
        success: false,
        message: 'Invalid user role.' 
      });

    } catch (err) {
      console.error('Manager access check failed:', err);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error while verifying access.' 
      });
    }
  };
};