const pool = require('../config/init_db');

// Для получения всех пользователей
const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id_user, u.last_name, u.first_name, u.middle_name, u.birth_date, 
             u.passport, u.contact_info, u.address, u.salary, 
             u.hire_date, d.department_name, s.status_name, p.position_name
      FROM "user" u
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
      FROM "user" u
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
      FROM "user" u
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

//Для добавления пользователя
const addUser = async (req, res) => {
  const { lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, departmentId, statusId, positionId } = req.body;
  try {
    const resultUser = await pool.query(`
      INSERT INTO "user" (last_name, first_name, middle_name, birth_date, passport, 
                          contact_info, address, salary, hire_date, department_id, 
                          status_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id_user
    `, [lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, departmentId, statusId]);

    const userId = resultUser.rows[0].id_user;

    // Подвязка к должности
    await pool.query(`
      INSERT INTO user_position (user_id, position_id)
      VALUES ($1, $2)
    `, [userId, positionId]);

    res.status(201).json({ message: 'Пользователь добавлен', userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      FROM "user" u
      JOIN department d ON u.department_id = d.id_department
      JOIN status s ON u.status_id = s.id_status
      JOIN position p ON u.position_id = p.id_position
      WHERE u.last_name = $1 AND u.first_name = $2 AND 
            (u.middle_name = $3 OR u.middle_name IS NULL)
    `, [lastName, firstName, middleName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Сотрудник не найден' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//ДЛя обновления пользователя
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, departmentId, statusId, positionId } = req.body;
  try {
    const result = await pool.query(`
      UPDATE "user"
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
    `, [lastName, firstName, middleName, birthDate, passport, contactInfo, address, salary, hireDate, departmentId, statusId, userId]);

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
    res.status(500).json({ error: err.message });
  }
};

// Для увольнения пользователя(статус в таблице status)
const dismissUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      UPDATE "user"
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
};
