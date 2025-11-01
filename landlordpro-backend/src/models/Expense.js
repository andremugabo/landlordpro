const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');

class Expense extends Model {}

Expense.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Base amount excluding VAT',
    },
    
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'FRW',
      comment: 'ISO 4217 currency code (e.g., USD, EUR, GBP)',
    },
    
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Date when the expense was incurred',
    },

    // 🏷️ Category of the expense
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type or category of the expense',
    },

    // 💰 VAT fields
    vat_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
      comment: 'VAT rate as percentage (e.g., 18.00 for 18%)',
    },
    
    vat_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
      comment: 'Calculated or actual VAT amount in currency',
    },

    // 💳 Payment tracking
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current payment status of the expense',
    },
    
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when the expense was paid',
    },
    
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Method used to pay the expense',
    },
    
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Due date for payment (if applicable)',
    },

    // 📎 Proof of expense
    proof: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'File path or URL for proof of expense (e.g., receipt/invoice)',
    },
    
    // 📝 Additional notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes or comments about the expense',
    },
    
    // 🔢 Reference number
    reference_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Invoice or receipt reference number',
    },
    
    // 👤 Vendor information
    vendor_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of the vendor or supplier',
    },
    
    vendor_contact: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Contact information for the vendor',
    },

    // 🔗 Foreign keys
    property_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to associated property',
    },
    
    local_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to associated local/unit',
    },
    
    // 👤 User tracking
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who created this expense record',
    },
    
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID who approved this expense',
    },
    
    approval_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when the expense was approved',
    },
  },
  {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses',
    timestamps: true,
    paranoid: true,
    underscored: true,
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['property_id'] },
      { fields: ['local_id'] },
      { fields: ['date'] },
      { fields: ['payment_status'] },
      { fields: ['category'] },
      { fields: ['created_by'] },
      { fields: ['due_date'] },
    ],
  }
);

module.exports = Expense;