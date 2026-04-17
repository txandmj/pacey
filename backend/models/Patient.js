// models/Patient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you have a configured Sequelize instance

const Patient = sequelize.define('Patient', {
    patient_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    pacemaker_dependent: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    incision_location: {
        type: DataTypes.STRING(12),
        allowNull: true,
    },
    pacemaker_manufacturer: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    magnet_response: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    impedance: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    image_path: {
        type: DataTypes.STRING(13383), // VARCHAR(13383)
    },
}, {
    tableName: 'Patient',
    timestamps: false,
});

module.exports = Patient;
