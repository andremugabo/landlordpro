const { Floor, Local, Property, Op } = require('../models');

class FloorService {
  /**
   * Get all floors (with property + locals) - with optional property filter
   * ✅ FIXED: Added user parameter for manager access control
   */
  async getAllFloors(propertyId = null, user = null) {
    const whereClause = {};
    
    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    return Floor.findAll({
      where: whereClause,
      include: [
        {
          model: Local,
          as: 'localsForFloor',
          attributes: ['id', 'status'],
        },
        {
          model: Property,
          as: 'propertyForFloor',
          attributes: ['id', 'name'],
          // ✅ Filter by manager if user is a manager
          required: user?.role === 'manager',
          where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
        },
      ],
      order: [['level_number', 'ASC']],
    });
  }

  /**
   * Get floors by property ID with safe column handling
   * ✅ FIXED: Added user parameter and manager verification
   */
  async getFloorsByPropertyId(propertyId, user = null) {
    try {
      // Validate propertyId
      if (!propertyId) {
        const error = new Error('Property ID is required');
        error.statusCode = 400;
        throw error;
      }

      // Verify property exists and manager has access
      const propertyWhere = { id: propertyId };
      if (user?.role === 'manager') {
        propertyWhere.manager_id = user.id;
      }

      const property = await Property.findOne({ where: propertyWhere });
      if (!property) {
        const error = new Error(
          user?.role === 'manager' 
            ? 'Property not found or you do not have access to it'
            : 'Property not found'
        );
        error.statusCode = 404;
        throw error;
      }

      const floors = await Floor.findAll({
        where: { property_id: propertyId },
        include: [
          {
            model: Local,
            as: 'localsForFloor',
            attributes: ['id', 'status', 'local_number', 'area'],
          },
          {
            model: Property,
            as: 'propertyForFloor',
            attributes: ['id', 'name', 'location'],
          },
        ],
        order: [['level_number', 'ASC']],
      });

      return {
        floors: floors.map(floor => ({
          id: floor.id,
          name: floor.name,
          level_number: floor.level_number,
          property_id: floor.property_id,
          property_name: floor.propertyForFloor?.name,
          localsForFloor: floor.localsForFloor || [],
          locals: floor.localsForFloor || [],
          locals_count: floor.localsForFloor?.length || 0
        })),
        property: {
          id: property.id,
          name: property.name,
          location: property.location
        }
      };

    } catch (error) {
      // Fallback logic remains the same
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using fallback query');
        
        const floors = await Floor.findAll({
          where: { property_id: propertyId },
          include: [
            {
              model: Local,
              as: 'localsForFloor',
              attributes: ['id', 'status'],
            },
            {
              model: Property,
              as: 'propertyForFloor',
              attributes: ['id', 'name', 'location'],
            },
          ],
          order: [['level_number', 'ASC']],
        });

        const floorsWithPlaceholders = floors.map(floor => {
          const localsWithPlaceholders = (floor.localsForFloor || []).map(local => ({
            ...local.toJSON(),
            local_number: `LOC-${local.id.substring(0, 8)}`,
            area: null
          }));
          
          return {
            id: floor.id,
            name: floor.name,
            level_number: floor.level_number,
            property_id: floor.property_id,
            property_name: floor.propertyForFloor?.name,
            localsForFloor: localsWithPlaceholders,
            locals: localsWithPlaceholders,
            locals_count: localsWithPlaceholders.length
          };
        });

        const property = await Property.findByPk(propertyId);
        return {
          floors: floorsWithPlaceholders,
          property: property ? {
            id: property.id,
            name: property.name,
            location: property.location
          } : null
        };
      }
      
      console.error('getFloorsByPropertyId error:', error);
      throw error;
    }
  }

  /**
   * Create a new floor
   * ✅ FIXED: Added user parameter to verify manager access
   */
  async createFloor(data, user = null) {
    // Verify property exists and manager has access
    const propertyWhere = { id: data.property_id };
    if (user?.role === 'manager') {
      propertyWhere.manager_id = user.id;
    }

    const property = await Property.findOne({ where: propertyWhere });
    if (!property) {
      const error = new Error(
        user?.role === 'manager'
          ? 'Property not found or you do not have access to it'
          : 'Property not found'
      );
      error.statusCode = 404;
      throw error;
    }

    // Check if floor with same level_number already exists for this property
    const existingFloor = await Floor.findOne({
      where: {
        property_id: data.property_id,
        level_number: data.level_number
      }
    });

    if (existingFloor) {
      const error = new Error('Floor with this level number already exists for this property');
      error.statusCode = 400;
      throw error;
    }

    return await Floor.create(data);
  }

  /**
   * Get a floor by ID with safe column handling
   * ✅ FIXED: Added user parameter to verify manager access
   */
  async getFloorById(id, user = null) {
    try {
      const includeOptions = [
        {
          model: Local,
          as: 'localsForFloor',
          attributes: ['id', 'status', 'local_number', 'area', 'rent_price'],
        },
        {
          model: Property,
          as: 'propertyForFloor',
          attributes: ['id', 'name', 'location', 'number_of_floors', 'manager_id'],
          // ✅ Filter by manager if user is a manager
          required: user?.role === 'manager',
          where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
        },
      ];

      const floor = await Floor.findByPk(id, { include: includeOptions });

      if (!floor) {
        const error = new Error(
          user?.role === 'manager'
            ? 'Floor not found or you do not have access to it'
            : 'Floor not found'
        );
        error.statusCode = 404;
        throw error;
      }

      return floor;
    } catch (error) {
      // Fallback for missing columns
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using fallback query');
        
        const floor = await Floor.findByPk(id, {
          include: [
            {
              model: Local,
              as: 'localsForFloor',
              attributes: ['id', 'status'],
            },
            {
              model: Property,
              as: 'propertyForFloor',
              attributes: ['id', 'name', 'location', 'number_of_floors', 'manager_id'],
              required: user?.role === 'manager',
              where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
            },
          ],
        });

        if (!floor) {
          const error = new Error(
            user?.role === 'manager'
              ? 'Floor not found or you do not have access to it'
              : 'Floor not found'
          );
          error.statusCode = 404;
          throw error;
        }

        const localsWithPlaceholders = (floor.localsForFloor || []).map(local => ({
          ...local.toJSON(),
          local_number: `LOC-${local.id.substring(0, 8)}`,
          area: null,
          rent_price: null
        }));

        return {
          ...floor.toJSON(),
          localsForFloor: localsWithPlaceholders
        };
      }
      throw error;
    }
  }

  /**
   * Update floor details
   * ✅ FIXED: Added user parameter to verify manager access
   */
  async updateFloor(id, data, user = null) {
    // First get the floor with property info
    const floor = await Floor.findByPk(id, {
      include: [{
        model: Property,
        as: 'propertyForFloor',
        attributes: ['id', 'manager_id']
      }]
    });

    if (!floor) {
      const error = new Error('Floor not found');
      error.statusCode = 404;
      throw error;
    }

    // Check manager access
    if (user?.role === 'manager' && floor.propertyForFloor?.manager_id !== user.id) {
      const error = new Error('You do not have access to this floor');
      error.statusCode = 403;
      throw error;
    }

    // If level_number is being updated, check for duplicates
    if (data.level_number && data.level_number !== floor.level_number) {
      const existingFloor = await Floor.findOne({
        where: {
          property_id: floor.property_id,
          level_number: data.level_number,
          id: { [Op.ne]: id }
        }
      });

      if (existingFloor) {
        const error = new Error('Another floor with this level number already exists for this property');
        error.statusCode = 400;
        throw error;
      }
    }

    await floor.update(data);
    return floor;
  }

  /**
   * Soft delete floor
   * ✅ FIXED: Added user parameter to verify manager access
   */
  async deleteFloor(id, user = null) {
    const floor = await Floor.findByPk(id, {
      include: [{
        model: Property,
        as: 'propertyForFloor',
        attributes: ['id', 'manager_id']
      }]
    });

    if (!floor) {
      const error = new Error('Floor not found');
      error.statusCode = 404;
      throw error;
    }

    // Check manager access
    if (user?.role === 'manager' && floor.propertyForFloor?.manager_id !== user.id) {
      const error = new Error('You do not have access to this floor');
      error.statusCode = 403;
      throw error;
    }

    // Check if floor has locals
    const localsCount = await Local.count({ where: { floor_id: id } });
    if (localsCount > 0) {
      const error = new Error('Cannot delete floor that has locals. Please delete or reassign locals first.');
      error.statusCode = 400;
      throw error;
    }

    await floor.destroy();
    return { message: 'Floor deleted successfully' };
  }

  /**
   * Get floors with detailed statistics with safe column handling
   * ✅ FIXED: Added user parameter for manager access control
   */
  async getFloorsWithStats(propertyId = null, user = null) {
    const whereClause = {};
    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    try {
      const floors = await Floor.findAll({
        where: whereClause,
        include: [
          {
            model: Local,
            as: 'localsForFloor',
            attributes: ['id', 'status', 'local_number', 'area', 'rent_price'],
          },
          {
            model: Property,
            as: 'propertyForFloor',
            attributes: ['id', 'name', 'location', 'manager_id'],
            // ✅ Filter by manager if user is a manager
            required: user?.role === 'manager',
            where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
          },
        ],
        order: [['level_number', 'ASC']],
      });

      return floors.map(floor => {
        const locals = floor.localsForFloor || [];
        const total = locals.length;
        const occupied = locals.filter(l => l.status === 'occupied').length;
        const available = locals.filter(l => l.status === 'available').length;
        const maintenance = locals.filter(l => l.status === 'maintenance').length;
        
        const totalArea = locals.reduce((sum, local) => sum + (parseFloat(local.area) || 0), 0);
        const totalRent = locals.reduce((sum, local) => sum + (parseFloat(local.rent_price) || 0), 0);
        const occupiedRent = locals
          .filter(l => l.status === 'occupied')
          .reduce((sum, local) => sum + (parseFloat(local.rent_price) || 0), 0);

        return {
          ...floor.toJSON(),
          statistics: {
            total_locals: total,
            occupied,
            available,
            maintenance,
            occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
            total_area: totalArea,
            total_rent: totalRent,
            occupied_rent: occupiedRent,
            revenue_percentage: totalRent > 0 ? parseFloat(((occupiedRent / totalRent) * 100).toFixed(2)) : 0
          }
        };
      });
    } catch (error) {
      // Fallback for missing columns
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using basic statistics');
        
        const floors = await Floor.findAll({
          where: whereClause,
          include: [
            {
              model: Local,
              as: 'localsForFloor',
              attributes: ['id', 'status'],
            },
            {
              model: Property,
              as: 'propertyForFloor',
              attributes: ['id', 'name', 'location', 'manager_id'],
              required: user?.role === 'manager',
              where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
            },
          ],
          order: [['level_number', 'ASC']],
        });

        return floors.map(floor => {
          const locals = floor.localsForFloor || [];
          const total = locals.length;
          const occupied = locals.filter(l => l.status === 'occupied').length;
          const available = locals.filter(l => l.status === 'available').length;
          const maintenance = locals.filter(l => l.status === 'maintenance').length;

          return {
            ...floor.toJSON(),
            statistics: {
              total_locals: total,
              occupied,
              available,
              maintenance,
              occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
              total_area: 0,
              total_rent: 0,
              occupied_rent: 0,
              revenue_percentage: 0
            }
          };
        });
      }
      throw error;
    }
  }

  /**
   * Occupancy report for one floor with safe column handling
   * ✅ FIXED: Added user parameter to verify manager access
   */
  async getFloorOccupancy(id, user = null) {
    try {
      const floor = await Floor.findByPk(id, {
        include: [
          { 
            model: Local, 
            as: 'localsForFloor', 
            attributes: ['id', 'status', 'local_number', 'area', 'rent_price'] 
          },
          {
            model: Property,
            as: 'propertyForFloor',
            attributes: ['id', 'name', 'manager_id'],
            required: user?.role === 'manager',
            where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
          }
        ],
      });

      if (!floor) {
        const error = new Error(
          user?.role === 'manager'
            ? 'Floor not found or you do not have access to it'
            : 'Floor not found'
        );
        error.statusCode = 404;
        throw error;
      }

      const locals = floor.localsForFloor || [];
      const total = locals.length;
      const occupied = locals.filter(l => l.status === 'occupied').length;
      const available = locals.filter(l => l.status === 'available').length;
      const maintenance = locals.filter(l => l.status === 'maintenance').length;

      const totalArea = locals.reduce((sum, local) => sum + (parseFloat(local.area) || 0), 0);
      const totalRent = locals.reduce((sum, local) => sum + (parseFloat(local.rent_price) || 0), 0);
      const occupiedRent = locals
        .filter(l => l.status === 'occupied')
        .reduce((sum, local) => sum + (parseFloat(local.rent_price) || 0), 0);

      return {
        floor_id: floor.id,
        floor_name: floor.name,
        level_number: floor.level_number,
        property_name: floor.propertyForFloor?.name,
        total_locals: total,
        occupied,
        available,
        maintenance,
        occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
        total_area: totalArea,
        total_rent: totalRent,
        occupied_rent: occupiedRent,
        revenue_percentage: totalRent > 0 ? parseFloat(((occupiedRent / totalRent) * 100).toFixed(2)) : 0,
        locals: locals.map(local => ({
          id: local.id,
          local_number: local.local_number,
          status: local.status,
          area: local.area,
          rent_price: local.rent_price
        }))
      };
    } catch (error) {
      // Fallback for missing columns
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using basic occupancy report');
        
        const floor = await Floor.findByPk(id, {
          include: [
            { 
              model: Local, 
              as: 'localsForFloor', 
              attributes: ['id', 'status'] 
            },
            {
              model: Property,
              as: 'propertyForFloor',
              attributes: ['id', 'name', 'manager_id'],
              required: user?.role === 'manager',
              where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
            }
          ],
        });

        if (!floor) {
          const error = new Error(
            user?.role === 'manager'
              ? 'Floor not found or you do not have access to it'
              : 'Floor not found'
          );
          error.statusCode = 404;
          throw error;
        }

        const locals = floor.localsForFloor || [];
        const total = locals.length;
        const occupied = locals.filter(l => l.status === 'occupied').length;
        const available = locals.filter(l => l.status === 'available').length;
        const maintenance = locals.filter(l => l.status === 'maintenance').length;

        return {
          floor_id: floor.id,
          floor_name: floor.name,
          level_number: floor.level_number,
          property_name: floor.propertyForFloor?.name,
          total_locals: total,
          occupied,
          available,
          maintenance,
          occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
          total_area: 0,
          total_rent: 0,
          occupied_rent: 0,
          revenue_percentage: 0,
          locals: locals.map(local => ({
            id: local.id,
            local_number: `LOC-${local.id.substring(0, 8)}`,
            status: local.status,
            area: null,
            rent_price: null
          }))
        };
      }
      throw error;
    }
  }

  /**
   * Occupancy report for all floors (with optional property filter)
   * ✅ Already has proper manager access control
   */
  async getAllFloorsOccupancy(propertyId = null, user = null) {
    const whereClause = {};
    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    try {
      const floors = await Floor.findAll({
        where: whereClause,
        include: [
          {
            model: Property,
            as: 'propertyForFloor',
            attributes: ['id', 'name', 'location', 'manager_id'],
            required: user?.role === 'manager',
            where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
          },
          {
            model: Local,
            as: 'localsForFloor',
            attributes: ['id', 'status', 'local_number', 'area', 'rent_price'],
          },
        ],
        order: [['level_number', 'ASC']],
      });

      return floors.map(floor => {
        const locals = floor.localsForFloor || [];
        const total = locals.length;
        const occupied = locals.filter(l => l.status === 'occupied').length;
        const available = locals.filter(l => l.status === 'available').length;
        const maintenance = locals.filter(l => l.status === 'maintenance').length;

        const totalArea = locals.reduce((sum, local) => sum + (parseFloat(local.area) || 0), 0);
        const totalRent = locals.reduce((sum, local) => sum + (parseFloat(local.rent_price) || 0), 0);
        const occupiedRent = locals
          .filter(l => l.status === 'occupied')
          .reduce((sum, local) => sum + (parseFloat(local.rent_price) || 0), 0);

        return {
          floor_id: floor.id,
          floor_name: floor.name,
          level_number: floor.level_number,
          property_id: floor.property_id,
          property_name: floor.propertyForFloor?.name,
          property_location: floor.propertyForFloor?.location,
          total_locals: total,
          occupied,
          available,
          maintenance,
          occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
          total_area: totalArea,
          total_rent: totalRent,
          occupied_rent: occupiedRent,
          revenue_percentage: totalRent > 0 ? parseFloat(((occupiedRent / totalRent) * 100).toFixed(2)) : 0
        };
      });
    } catch (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using basic occupancy report');
        
        const floors = await Floor.findAll({
          where: whereClause,
          include: [
            {
              model: Property,
              as: 'propertyForFloor',
              attributes: ['id', 'name', 'location', 'manager_id'],
              required: user?.role === 'manager',
              where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
            },
            {
              model: Local,
              as: 'localsForFloor',
              attributes: ['id', 'status'],
            },
          ],
          order: [['level_number', 'ASC']],
        });

        return floors.map(floor => {
          const locals = floor.localsForFloor || [];
          const total = locals.length;
          const occupied = locals.filter(l => l.status === 'occupied').length;
          const available = locals.filter(l => l.status === 'available').length;
          const maintenance = locals.filter(l => l.status === 'maintenance').length;

          return {
            floor_id: floor.id,
            floor_name: floor.name,
            level_number: floor.level_number,
            property_id: floor.property_id,
            property_name: floor.propertyForFloor?.name,
            property_location: floor.propertyForFloor?.location,
            total_locals: total,
            occupied,
            available,
            maintenance,
            occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
            total_area: 0,
            total_rent: 0,
            occupied_rent: 0,
            revenue_percentage: 0
          };
        });
      }
      
      console.error('getAllFloorsOccupancy error:', error);
      throw error;
    }
  }
}

module.exports = new FloorService();