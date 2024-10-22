const express = require('express');
const { initDatabase } = require('./config/init_db');

const app = express();

const startServer = async () => {
  try {
    const pool = await initDatabase();

    app.use(express.json());


    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

startServer();
