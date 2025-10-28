const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');

class Floor extends Model {}

Floor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    level_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { isInt: true },
      comment: 'Level number: -1 = basement, 0 = ground, 1 = first floor, etc.',
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { len: [2, 50] },
      comment: 'Human-readable name, e.g., "Basement", "Ground Floor", "1st Floor"',
    },

    property_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'properties', key: 'id' },
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Floor',
    tableName: 'floors',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

module.exports = Floor;
