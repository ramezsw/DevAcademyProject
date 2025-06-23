const { Sequelize } = require('sequelize');
require('dotenv').config();

// get db configs from env vars. the env vars point to Azure SQL DB, we can use local postgres db if needed as well.
const dbName = process.env.DB_NAME || 'order_management';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';

//create Sequelize instance (Sequelize is the ORM of choice here, we can also use knex but I chose not to use it for this project)
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mssql', // can use postgres instead of mssql but I use mssql because it's what I created for my Azure SQL DB.
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      options: {
        encrypt: true,
        trustServerCertificate: true
      }
    }
  });

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};