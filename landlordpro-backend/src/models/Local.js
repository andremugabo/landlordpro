const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Property = require('./Property');
const Floor = require('./Floor');

class Local extends Model {}

Local.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    reference_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    status: {
      type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
      defaultValue: 'available'
    },

    size_m2: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0 }
    },

    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Level number: -1 = basement, 0 = ground, 1 = first floor, etc.'
    },

    property_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' }
    },

    floor_id: {
      type: DataTypes.UUID,
      allowNull: false, // will be set automatically before creation
      references: { model: 'floors', key: 'id' }
    }
  },
  {
    sequelize,
    modelName: 'Local',
    tableName: 'locals',
    timestamps: true,
    paranoid: true,
    underscored: true,

    hooks: {
      // 🛠️ Before saving, validate and auto-link to floor
      async beforeSave(local) {
        const property = await Property.findByPk(local.property_id);
        if (!property) throw new Error('Property not found for this local.');

        // ✅ Validate floor level
        if (local.level > property.number_of_floors)
          throw new Error(
            `Invalid level: property only has ${property.number_of_floors} floors above ground.`
          );

        if (local.level < 0 && !property.has_basement)
          throw new Error('This property does not have a basement.');

        if (local.level < -1)
          throw new Error('Invalid level: basement can only be level -1.');

        // 🧩 Automatically find the matching floor
        const floor = await Floor.findOne({
          where: { property_id: local.property_id, level_number: local.level }
        });

        if (!floor) {
          throw new Error(`No floor found for level ${local.level} in this property.`);
        }

        local.floor_id = floor.id;
      }
    }
  }
);

module.exports = Local;
