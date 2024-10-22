const express = require('express');
const userController = require('../controllers/actions_with_db');

const router = express.Router();

router.get('/users', userController.getUsers);
router.get('/users/department/:departmentId', userController.getUsersByDepartment);
router.post('/users', userController.addUser);
router.get('/users/fullname/:lastName/:firstName/:middleName', userController.getUserByFullName);
router.put('/users/:userId', userController.updateUser);
router.delete('/users/:userId', userController.dismissUser);

module.exports = router;
