const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const Document = sequelize.define('Document', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
file_url: { type: DataTypes.STRING, allowNull: false },
file_type: { type: DataTypes.STRING, allowNull: false },
uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
owner_id: { type: DataTypes.UUID, allowNull: false }
}, { tableName: 'documents', timestamps: false });


module.exports = Document;