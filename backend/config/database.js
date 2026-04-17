// config/database.js

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'flask_app',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'db',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: false,
    }
);

// // Test the connection
// (async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('Connection to MariaDB has been established successfully.');
//     } catch (error) {
//         console.error('Unable to connect to the database:', error);
//     }
// })();

module.exports = sequelize;
