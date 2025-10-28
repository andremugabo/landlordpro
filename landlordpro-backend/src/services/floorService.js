const { Floor, Local, Property } = require('../models');

class FloorService {
  // Get all floors
  async getAllFloors() {
    return Floor.findAll({
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

  // Get a floor by ID
  async getFloorById(id) {
    const floor = await Floor.findByPk(id, {
      include: {
        model: Local,
        as: 'localsForFloor',
        attributes: ['id', 'status'],
      },
    });
    if (!floor) throw new Error('Floor not found');
    return floor;
  }

  // Update floor
  async updateFloor(id, data) {
    const floor = await Floor.findByPk(id);
    if (!floor) throw new Error('Floor not found');
    await floor.update(data);
    return floor;
  }

  // Soft delete floor
  async deleteFloor(id) {
    const floor = await Floor.findByPk(id);
    if (!floor) throw new Error('Floor not found');
    await floor.destroy();
    return { message: 'Floor deleted successfully' };
  }

  // Occupancy report for one floor
  async getFloorOccupancy(id) {
    const floor = await Floor.findByPk(id, {
      include: { model: Local, as: 'localsForFloor', attributes: ['status'] },
    });
    if (!floor) throw new Error('Floor not found');

    const locals = floor.localsForFloor || [];
    const total = locals.length;
    const occupied = locals.filter(l => l.status === 'occupied').length;
    const available = locals.filter(l => l.status === 'available').length;
    const maintenance = locals.filter(l => l.status === 'maintenance').length;

    return {
      floor_id: floor.id,
      floor_name: floor.name,
      level_number: floor.level_number,
      total_locals: total,
      occupied,
      available,
      maintenance,
      occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
    };
  }

  // Occupancy report for all floors
  async getAllFloorsOccupancy() {
    const floors = await Floor.findAll({
      include: { model: Local, as: 'localsForFloor', attributes: ['status'] },
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
        total_locals: total,
        occupied,
        available,
        maintenance,
        occupancy_rate: total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0,
      };
    });
  }
}

// Export singleton instance
module.exports = new FloorService();
