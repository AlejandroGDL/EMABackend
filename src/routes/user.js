const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

//Obtener usuarios
router.get('/user/:StudentID', userController.getUser);
//Crear usuarios
router.post('/user', userController.createUser);
//Login
router.post('/login', userController.loginUser);
//Eventos asistidos
router.get('/user/events/:StudentID', userController.getAssistedEvents);
//Obtener Push Token
router.post('/user/pushToken', userController.getPushToken);
//Enviar notificación
router.post('/user/sendNotification', userController.sendNotification);
//Actualizar contraseña usuario
router.post('/user/changePassword', userController.changePassword);
//Actualizar contraseña por un administrador
router.post(
  '/user/changePasswordbyAdmin',
  userController.changePasswordbyAdmin
);

module.exports = router;
