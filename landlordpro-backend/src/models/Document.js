const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Document = sequelize.define(
  'Document',
  {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    fileUrl: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      field: 'file_url' 
    },
    fileType: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      field: 'file_type' 
    },
    uploadedAt: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW, 
      field: 'uploaded_at' 
    },
    ownerId: { 
      type: DataTypes.UUID, 
      allowNull: false, 
      field: 'owner_id' 
    }
  },
  {
    tableName: 'documents',
    timestamps: true,
    underscored: true
  }
);

module.exports = Document;
