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
        id_department SERIAL PRIMARY KEY,
        department_name VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS status (
        id_status SERIAL PRIMARY KEY,
        status_name VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS position (
        id_position SERIAL PRIMARY KEY,
        position_name VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_test_task (
        id_user SERIAL PRIMARY KEY,
        last_name VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        birth_date DATE NOT NULL,
        passport VARCHAR(11) NOT NULL CHECK (passport ~ '^\\d{4}-\\d{6}$'),
        contact_info VARCHAR(15) NOT NULL CHECK (contact_info ~ '^[0-9]{1} \\d{3} \\d{3} \\d{2} \\d{2}$' OR contact_info ~ '^\\+\\d{1} \\d{3} \\d{3} \\d{2} \\d{2}$'),
        address TEXT NOT NULL,
        salary NUMERIC(12, 2) NOT NULL CHECK (salary > 0),
        hire_date DATE NOT NULL,
        department_id INTEGER NOT NULL,
        status_id INTEGER NOT NULL,
        FOREIGN KEY (department_id) REFERENCES department(id_department),
        FOREIGN KEY (status_id) REFERENCES status(id_status)
    );
  `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_position (
        user_id INTEGER NOT NULL,
        position_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, position_id),
        FOREIGN KEY (user_id) REFERENCES user_test_task (id_user) ON DELETE CASCADE,
        FOREIGN KEY (position_id) REFERENCES position (id_position) ON DELETE CASCADE
      );
    `);

    const { rows } = await pool.query(`SELECT COUNT(*) FROM status`);
    const count = parseInt(rows[0].count, 10);

    if (count === 0) {
      await pool.query(`
        INSERT INTO status (status_name) VALUES 
        ('Работает'), 
        ('Уволен')
      `);
      console.log("Статусы 'Работает' и 'Уволен' добавлены в таблицу status.");
    } else {
      console.log("Таблица status уже содержит данные.");
    }

    console.log("Все таблицы успешно созданы");
  } catch (error) {
    console.error("Ошибка при создании таблиц", error);
  } 
};

const initDatabase = async () => {
  await createTables();
  return pool;
};

module.exports = { initDatabase, pool };