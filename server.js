const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { sequelize } = require('./src/models');

// Load environment variables
dotenv.config();

const app = express();

// Middleware init
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', routes);

// error handling middleware
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Sync database models
    await sequelize.sync();
    console.log('Database synchronized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Health check at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

// Can start the server by running "npm run dev", or node start, or just node server.js

// To run the tests, we can run below command from root directory of the project.
//npx jest --config=jest.config.js --runInBand

//cd c:\Users\ramezsweiss\Documents\DevAcademyProject && npx jest --config=jest.config.js --runInBand