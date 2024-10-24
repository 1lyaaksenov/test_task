const { pool } = require('../config/init_db');

// Для получения всех пользователей
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id_user, u.last_name, u.first_name, u.middle_name, u.birth_date, 
            u.passport, u.contact_info, u.address, u.salary, 
            u.hire_date, d.department_name, s.status_name, p.position_name
      FROM user_test_task u
      JOIN department d ON u.department_id = d.id_department
      JOIN status s ON u.status_id = s.id_status
      JOIN user_position up ON u.id_user = up.user_id
      JOIN position p ON up.position_id = p.id_position
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Для получения пользователей по отделу
const getUsersByDepartment = async (req, res) => {
  const { departmentName } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.id_user, u.last_name, u.first_name, u.middle_name, u.birth_date, 
            u.passport, u.contact_info, u.address, u.salary, 
            u.hire_date, d.department_name, s.status_name, p.position_name
      FROM user_test_task u
      JOIN department d ON u.department_id = d.id_department
      JOIN status s ON u.status_id = s.id_status
      JOIN user_position up ON u.id_user = up.user_id
      JOIN position p ON up.position_id = p.id_position
      WHERE d.department_name = $1
    `, [departmentName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователи не найдены в указанном департаменте' });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Для получения пользователя по профессии 
const getUsersByPosition = async (req, res) => {
  const { positionName } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.id_user, u.last_name, u.first_name, u.middle_name, u.birth_date, 
            u.passport, u.contact_info, u.address, u.salary, 
            u.hire_date, d.department_name, s.status_name, p.position_name
      FROM user_test_task u
      JOIN department d ON u.department_id = d.id_department
      JOIN status s ON u.status_id = s.id_status
      JOIN user_position up ON u.id_user = up.user_id
      JOIN position p ON up.position_id = p.id_position
      WHERE p.position_name = $1
    `, [positionName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователи с указанной должностью не найдены' });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Для создания нового отдела, если он не существует
const ensureDepartmentExists = async (departmentName) => {
  if (!departmentName) {
    throw new Error("Department name cannot be null or empty");
  }

  const result = await pool.query('SELECT id_department FROM department WHERE department_name = $1', [departmentName]);
  
  if (result.rowCount === 0) {
    const insertResult = await pool.query('INSERT INTO department (department_name) VALUES ($1) RETURNING id_department', [departmentName]);
    return insertResult.rows[0].id_department;
  }
  
  return result.rows[0].id_department;
};


// Для создания новой должности, если она не существует
const ensurePositionExists = async (positionName) => {
  const result = await pool.query('SELECT id_position FROM position WHERE position_name = $1', [positionName]);
  if (result.rowCount === 0) {
    const insertResult = await pool.query('INSERT INTO position (position_name) VALUES ($1) RETURNING id_position', [positionName]);
    return insertResult.rows[0].id_position; 
  }
  return result.rows[0].id_position;
};


// Функция для создания пользователя
const addUser = async (req, res) => {
  const {
    lastName,
    firstName,
    middleName,
    birthDate,
    passport,
    contactInfo,
    address,
    salary,
    hireDate,
    departmentName,
    positionName,
  } = req.body;

  try {
    const departmentId = await ensureDepartmentExists(departmentName);
    const positionId = await ensurePositionExists(positionName);

    const result = await pool.query(`
      INSERT INTO user_test_task (
        last_name, 
        first_name, 
        middle_name, 
        birth_date, 
        passport, 
        contact_info, 
        address, 
        salary, 
        hire_date, 
        department_id, 
        status_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING id_user
    `, [
      lastName,
      firstName,
      middleName,
      birthDate,
      passport,
      contactInfo,
      address,
      salary,
      hireDate,
      departmentId,
      1, // вначале всегда не уволен
    ]);

    const userId = result.rows[0].id_user;

    await pool.query(`
      INSERT INTO user_position (user_id, position_id)
      VALUES ($1, $2)
    `, [userId, positionId]);

    res.status(201).json({ id_user: userId, message: 'Пользователь успешно создан' });
  } catch (error) {
    console.error("Error creating user", error);
    res.status(500).json({ error: error.message });
  }
};

// Для получения пользователя по полному ФИО
const getUserByFullName = async (req, res) => {
  const { lastName, firstName, middleName } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.id_user, u.last_name, u.first_name, u.middle_name, u.birth_date, 
        u.passport, u.contact_info, u.address, u.salary, 
        u.hire_date, d.department_name, s.status_name, p.position_name
        FROM user_test_task u
        JOIN department d ON u.department_id = d.id_department
        JOIN status s ON u.status_id = s.id_status
        LEFT JOIN user_position up ON u.id_user = up.user_id
        LEFT JOIN position p ON up.position_id = p.id_position
        WHERE u.last_name = $1 AND u.first_name = $2 AND 
        (u.middle_name = $3 OR u.middle_name IS NULL);
    `, [lastName, firstName, middleName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.last_name,
        u.first_name,
        u.middle_name,
        u.birth_date,
        u.passport,
        u.contact_info,
        u.address,
        u.salary,
        u.hire_date,
        d.department_name,
        s.status_name,
        p.position_name
      FROM 
        user_test_task u
      JOIN 
        department d ON u.department_id = d.id_department
      JOIN 
        status s ON u.status_id = s.id_status
      JOIN 
        user_position up ON u.id_user = up.user_id
      JOIN 
        position p ON up.position_id = p.id_position
      WHERE 
        u.id_user = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return res.status(500).json({ error: 'Ошибка при выполнении запроса на получение данных пользователя' });
  }
};

// Для обновления пользователя
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { 
    lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, 
    departmentName, statusId = 1, positionName
  } = req.body;

  try {
    const positionId = await ensurePositionExists(positionName);
    const departmentId = await ensureDepartmentExists(departmentName);

    const result = await pool.query(`
      UPDATE user_test_task
      SET last_name = $1,
          first_name = $2,
          middle_name = $3,
          birth_date = $4,
          passport = $5,
          contact_info = $6,
          address = $7,
          salary = $8,
          hire_date = $9,
          department_id = $10,
          status_id = $11
      WHERE id_user = $12
      RETURNING id_user
    `, [
      lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, departmentId, statusId, userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await pool.query(`
      UPDATE user_position
      SET position_id = $1
      WHERE user_id = $2
    `, [positionId, userId]);

    res.status(200).json({ message: 'Пользователь обновлен' });
  } catch (err) {
    console.error('Ошибка обновления пользователя:', err);
    res.status(500).json({ error: err.message });
  }
};


// Для увольнения пользователя(статус в таблице status)
const dismissUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      UPDATE user_test_task
      SET status_id = (SELECT id_status FROM status WHERE status_name = 'Уволен')
      WHERE id_user = $1
    `, [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }

    res.status(200).json({ message: 'Сотрудник уволен' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUsers,
  getUsersByDepartment,
  addUser,
  getUserByFullName,
  updateUser,
  dismissUser,
  getUsersByPosition,
  getUserById
};

