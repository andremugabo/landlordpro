require('dotenv').config();
const { Sequelize } = require('sequelize');


const sequelize = new Sequelize(
process.env.DB_NAME,
process.env.DB_USER,
process.env.DB_PASS,
{
host: process.env.DB_HOST,
dialect: 'postgres',
port: process.env.DB_PORT || 5432,
logging: false
}
);


(async () => {
try {
await sequelize.authenticate();
console.log('✅ DB connection established');
} catch (err) {
console.error('❌ DB connection failed:', err.message);
}
})();


module.exports = sequelize;