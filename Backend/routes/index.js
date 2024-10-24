const express = require('express');
const userController = require('../controllers/actions_with_db');

const router = express.Router();

router.get('/users', userController.getUsers);
router.get('/users/department/:departmentName', userController.getUsersByDepartment);
router.get('/users/position/:positionName', userController.getUsersByPosition);
router.get('/users/fullname/:lastName/:firstName/:middleName', userController.getUserByFullName);
router.post('/users', userController.addUser);
router.put('/users/:userId', userController.updateUser);
router.delete('/users/:userId', userController.dismissUser);
router.get('/users/:userId', userController.getUserById);

module.exports = router;
