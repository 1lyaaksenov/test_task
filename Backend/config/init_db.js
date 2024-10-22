const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS department (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS status (
        id SERIAL PRIMARY KEY,
        status_name VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS position (
        id SERIAL PRIMARY KEY,
        position_name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        last_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        birth_date DATE NOT NULL,
        passport VARCHAR(11) NOT NULL CHECK (passport ~ '^[0-9]{4}-[0-9]{6}$'),
        contact_info VARCHAR(20) NOT NULL CHECK (contact_info ~ '^\+?[0-9\-]+$'),
        address TEXT NOT NULL,
        salary NUMERIC(12, 2) NOT NULL CHECK (salary > 0),
        hire_date DATE NOT NULL,
        department_id INTEGER NOT NULL,
        status_id INTEGER NOT NULL,
        FOREIGN KEY (department_id) REFERENCES department(id),
        FOREIGN KEY (status_id) REFERENCES status(id)
      );
      
      CREATE TABLE IF NOT EXISTS user_position (
        user_id INTEGER NOT NULL,
        position_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, position_id),
        FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE,
        FOREIGN KEY (position_id) REFERENCES position (id) ON DELETE CASCADE
      );
    `);

    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error creating tables", error);
  }
};

const initDatabase = async () => {
  await createTables();
  return pool;
};

module.exports = { initDatabase };
