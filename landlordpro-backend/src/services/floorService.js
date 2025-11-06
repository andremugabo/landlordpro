const { Floor, Local, Property, Op } = require('../models');

class FloorService {
  /**
   * Get all floors (with property + locals) - with optional property filter
   */
  async getAllFloors(propertyId = null) {
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
        },
      ],
      order: [['level_number', 'ASC']],
    });
  }

  /**
   * Get floors by property ID with safe column handling
   */
  async getFloorsByPropertyId(propertyId) {
    try {
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

      if (!floors || floors.length === 0) {
        const error = new Error('No floors found for this property');
        error.statusCode = 404;
        throw error;
      }

      return floors;
    } catch (error) {
      // If columns don't exist, fall back to basic query
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

        // Add placeholder data for missing fields
        const floorsWithPlaceholders = floors.map(floor => {
          const localsWithPlaceholders = (floor.localsForFloor || []).map(local => ({
            ...local.toJSON(),
            local_number: `LOC-${local.id.substring(0, 8)}`, // Generate placeholder
            area: null
          }));
          
          return {
            ...floor.toJSON(),
            localsForFloor: localsWithPlaceholders
          };
        });

        return floorsWithPlaceholders;
      }
      throw error;
    }
  }

  /**
   * Create a new floor
   */
  async createFloor(data) {
    // Validate property exists
    const property = await Property.findByPk(data.property_id);
    if (!property) {
      const error = new Error('Property not found');
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
   */
  async getFloorById(id) {
    try {
      const floor = await Floor.findByPk(id, {
        include: [
          {
            model: Local,
            as: 'localsForFloor',
            attributes: ['id', 'status', 'local_number', 'area', 'rent_price'],
          },
          {
            model: Property,
            as: 'propertyForFloor',
            attributes: ['id', 'name', 'location', 'number_of_floors'],
          },
        ],
      });

      if (!floor) {
        const error = new Error('Floor not found');
        error.statusCode = 404;
        throw error;
      }

      return floor;
    } catch (error) {
      // If columns don't exist, fall back to basic query
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
              attributes: ['id', 'name', 'location', 'number_of_floors'],
            },
          ],
        });

        if (!floor) {
          const error = new Error('Floor not found');
          error.statusCode = 404;
          throw error;
        }

        // Add placeholder data for missing fields
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
   */
  async updateFloor(id, data) {
    const floor = await Floor.findByPk(id);
    if (!floor) {
      const error = new Error('Floor not found');
      error.statusCode = 404;
      throw error;
    }

    // If level_number is being updated, check for duplicates
    if (data.level_number && data.level_number !== floor.level_number) {
      const existingFloor = await Floor.findOne({
        where: {
          property_id: floor.property_id,
          level_number: data.level_number,
          id: { [Op.ne]: id } // Exclude current floor
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
   */
  async deleteFloor(id) {
    const floor = await Floor.findByPk(id);
    if (!floor) {
      const error = new Error('Floor not found');
      error.statusCode = 404;
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
   */
  async getFloorsWithStats(propertyId = null) {
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
            attributes: ['id', 'name', 'location'],
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
      // If columns don't exist, fall back to basic stats
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
              attributes: ['id', 'name', 'location'],
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
   */
  async getFloorOccupancy(id) {
    try {
      const floor = await Floor.findByPk(id, {
        include: { 
          model: Local, 
          as: 'localsForFloor', 
          attributes: ['id', 'status', 'local_number', 'area', 'rent_price'] 
        },
      });

      if (!floor) {
        const error = new Error('Floor not found');
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
      // If columns don't exist, fall back to basic occupancy report
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using basic occupancy report');
        
        const floor = await Floor.findByPk(id, {
          include: { 
            model: Local, 
            as: 'localsForFloor', 
            attributes: ['id', 'status'] 
          },
        });

        if (!floor) {
          const error = new Error('Floor not found');
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
   * Occupancy report for all floors (with optional property filter) with safe column handling
   */
  async getAllFloorsOccupancy(propertyId = null) {
    const whereClause = {};
    if (propertyId) {
      whereClause.property_id = propertyId;
    }

    try {
      const floors = await Floor.findAll({
        where: whereClause,
        include: { 
          model: Local, 
          as: 'localsForFloor', 
          attributes: ['id', 'status', 'local_number', 'area', 'rent_price'] 
        },
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
      // If columns don't exist, fall back to basic occupancy report
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('Local table missing some columns, using basic occupancy report');
        
        const floors = await Floor.findAll({
          where: whereClause,
          include: { 
            model: Local, 
            as: 'localsForFloor', 
            attributes: ['id', 'status'] 
          },
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
      throw error;
    }
  }
}

module.exports = new FloorService();