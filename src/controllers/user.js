const UserRepo = require('../models/user');

//Controlador para crear un usuario
const createUser = async (req, res) => {
  const {
    StudentName,
    StudentLastName,
    StudentID,
    StudentPassword,
    StudentCareer,
    StudentSemester,
    StudentHours,
    IsAdmin,
    AssitedEvents,
  } = req.body;

  try {
    const savedUser = await UserRepo.create({
      StudentName,
      StudentLastName,
      StudentID,
      StudentPassword,
      StudentCareer,
      StudentSemester,
      StudentHours,
      IsAdmin,
      AssitedEvents,
    });
    res.json(savedUser);
  } catch (error) {
    res.json(error.message);
  }
};

//Controlador para obtener un usuario
const getUser = async (req, res) => {
  const { StudentID } = req.params;

  try {
    const user = await UserRepo.findOne({ StudentID });

    if (!user) {
      res.json('Usuario no encontrado');
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Error al encontrar al usuario',
      error: error.message,
    });
  }
};

//Controlador para loguear un usuario
const loginUser = async (req, res) => {
  const { StudentID, StudentPassword } = req.body;

  try {
    const user = await UserRepo.login({ StudentID, StudentPassword });

    res.json(user);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

//Controlador para obtener los eventos asistidos por un usuario
const getAssistedEvents = async (req, res) => {
  const { StudentID } = req.params;

  try {
    const user = await UserRepo.getAssistedEvents({ StudentID });
    res.json(user.AssistedEvents);
  } catch (error) {
    res.json('Error al encontrar los eventos asistidos', error.message);
  }
};

//Controlador para obtener el token de push
const getPushToken = async (req, res) => {
  const { PushToken, StudentID } = req.body;

  try {
    const user = await UserRepo.getPushToken({ PushToken, StudentID });
    res.json(user);
  } catch (error) {
    res.status(500).json('Error al insertar el token', error.message);
  }
};

//Controlador para enviar notificaciones
const sendNotification = async (req, res) => {
  const { StudentID, Body } = req.body;

  try {
    const user = await UserRepo.sendNotification({ StudentID, Body });
    res.json(user);
  } catch (error) {
    res.json({
      message: 'Error al actualizar el evento',
      error: error.message,
    });
  }
};

//Cambiar contraseña
const changePassword = async (req, res) => {
  const { StudentID, StudentPassword, StudentNewPassword } = req.body;

  try {
    const user = await UserRepo.updatePassword({
      StudentID,
      StudentPassword,
      StudentNewPassword,
    });
    res.json(user);
  } catch (error) {
    res.json({
      message: 'Error al actualizar la contraseña',
      error: error.message,
    });
  }
};

//Actulizar contraseña por un administrador
const changePasswordbyAdmin = async (req, res) => {
  const { StudentID, StudentNewPassword } = req.body;

  try {
    const user = await UserRepo.updatePasswordbyAdmin({
      StudentID,
      StudentNewPassword,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar la contraseña',
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUser,
  loginUser,
  getAssistedEvents,
  getPushToken,
  sendNotification,
  changePassword,
  changePasswordbyAdmin,
};
