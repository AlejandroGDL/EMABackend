const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const UserSchema = new mongoose.Schema({
  StudentName: {
    type: String,
    required: true,
    unique: true,
  },
  StudentLastName: {
    type: String,
    required: true,
  },
  StudentID: {
    type: Number,
    required: true,
  },
  StudentPassword: {
    type: String,
    required: true,
  },
  StudentCareer: {
    type: String,
  },
  StudentSemester: {
    type: Number,
  },
  StudentHours: {
    type: Number,
    required: true,
    default: 0,
  },
  IsAdmin: {
    type: Boolean,
    default: false,
  },
  ExpoPushToken: {
    type: String,
  },
  IsPasswordChanged: {
    type: Boolean,
    default: false,
  },
  AssistedEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
});

const User = mongoose.model('User', UserSchema);
module.exports.user = User;

class UserRepo {
  // Crear un usuario
  static async create({
    StudentName,
    StudentLastName,
    StudentID,
    StudentPassword,
    StudentCareer,
    StudentSemester,
    StudentHours,
    IsAdmin,
    AssistedEvents,
  }) {
    if (!StudentName) {
      console.error('El nombre es requerido');
      throw new Error('El nombre es requerido');
    }
    if (!StudentLastName) {
      console.error('El apellido es requerido');
      throw new Error('El apellido es requerido');
    }
    if (!StudentID) {
      console.error('El ID es requerido');
      throw new Error('El ID es requerido');
    }
    if (!StudentPassword) {
      console.error('La contraseña es requerida');
      throw new Error('La contraseña es requerida');
    }
    if (StudentPassword.length < 8) {
      console.error('La contraseña debe tener al menos 8 caracteres');
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (typeof StudentID !== 'number') {
      console.error('El ID debe ser un número');
      throw new Error('El ID debe ser un número');
    }
    if (typeof StudentSemester !== 'number') {
      console.error('El semestre debe ser un número');
      throw new Error('El semestre debe ser un número');
    }
    if (typeof StudentHours !== 'number') {
      console.error('Las horas deben ser un número');
      throw new Error('Las horas deben ser un número');
    }

    if (
      typeof StudentName !== 'string' ||
      typeof StudentLastName !== 'string' ||
      typeof StudentPassword !== 'string' ||
      typeof StudentCareer !== 'string'
    ) {
      console.error(
        'El Nombre, Apellidos y Contraseña deben ser de tipo string'
      );
      throw new Error(
        'El Nombre, Apellidos y Contraseña deben ser de tipo string'
      );
    }

    const hashedPassword = await bcrypt.hash(StudentPassword, saltRounds);

    const UserModel = mongoose.model('User', UserSchema);

    const User = await UserModel.create({
      StudentName,
      StudentLastName,
      StudentID,
      StudentPassword: hashedPassword,
      StudentCareer,
      StudentSemester,
      StudentHours,
      IsAdmin,
      AssistedEvents,
    });

    return User;
  }
  // Encontrar un usuario por su StudentID
  static async findOne({ StudentID }) {
    const UserModel = mongoose.model('User', UserSchema);

    try {
      const User = await UserModel.findOne({ StudentID }).select(
        '-StudentPassword'
      );
      if (!User) {
        console.error('Este usuario no existe');
        throw new Error('Este usuario no existe');
      }
      return User;
    } catch (error) {
      console.error(error.message);
      throw new Error(error.message);
    }
  }
  // Metodo login
  static async login({ StudentID, StudentPassword }) {
    Validation.StudentID(StudentID);
    Validation.StudentPassword(StudentPassword);
    const UserModel = mongoose.model('User', UserSchema);

    const User = await UserModel.findOne({ StudentID });
    if (!User) {
      throw new Error('Usuario no encontrado');
    }
    const isPasswordValid = await bcrypt.compare(
      StudentPassword,
      User.StudentPassword
    );
    if (!isPasswordValid) {
      throw new Error('Contraseña incorrecta');
    }

    return {
      StudentName: User.StudentName,
      StudentLastName: User.StudentLastName,
      StudentID: User.StudentID,
      IsPasswordChanged: User.IsPasswordChanged,
      StudentCareer: User.StudentCareer,
      StudentSemester: User.StudentSemester,
      StudentHours: User.StudentHours,
      IsAdmin: User.IsAdmin,
      AssistedEvents: User.AssistedEvents,
    };
  }
  //Actualizar un usuario
  static async update({
    StudentID,
    StudentName,
    StudentLastName,
    StudentPassword,
    StudentCareer,
    StudentSemester,
    StudentHours,
    IsAdmin,
  }) {
    Validation.StudentID(StudentID);
    const UserModel = mongoose.model('User', UserSchema);

    const User =
      StudentPassword &&
      (await bcrypt.hash(StudentPassword, saltRounds)).then(
        (hashedPassword) => {
          return UserModel.findByIdAndUpdate(
            { StudentID },
            {
              StudentName,
              StudentLastName,
              StudentPassword: hashedPassword,
              StudentCareer,
              StudentSemester,
              StudentHours,
              IsAdmin,
            },
            { new: true }
          );
        }
      );

    return User;
  }
  // Eliminar un usuario
  static async delete({ StudentID }) {
    Validation.StudentID(StudentID);
    const UserModel = mongoose.model('User', UserSchema);

    const User = await UserModel.deleteOne({ StudentID });
    return User;
  }
  // Obtener usuario y eventos asistidos
  static async getAssistedEvents({ StudentID }) {
    try {
      const UserModel = mongoose.model('User', UserSchema);

      const User = await UserModel.findOne({ StudentID }).populate(
        'AssistedEvents'
      );

      return User;
    } catch (error) {
      console.error(error.message);
      throw new Error(error.message);
    }
  }
  // Obtener token de push
  static async getPushToken({ StudentID, PushToken }) {
    Validation.StudentID(StudentID);
    const UserModel = mongoose.model('User', UserSchema);

    const User = await UserModel.findOneAndUpdate(
      { StudentID },
      { ExpoPushToken: PushToken },
      { new: true }
    );
    return User;
  }
  // Enviar notificación
  static async sendNotification({ StudentID, Title, Body }) {
    const UserModel = mongoose.model('User', UserSchema);

    const User = await UserModel.findOne({ StudentID });

    // Enviar notificación
    const message = {
      to: User.ExpoPushToken,
      sound: 'default',
      title: Title,
      body: Body,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return User;
  }
  //Actualizar Contraseña
  static async updatePassword({
    StudentID,
    StudentPassword,
    StudentNewPassword,
  }) {
    //Validar el ID y la contraseña
    Validation.StudentID(StudentID);
    Validation.StudentPassword(StudentPassword);
    Validation.StudentPassword(StudentNewPassword);

    //Modelo de usuario
    const UserModel = mongoose.model('User', UserSchema);

    //Buscar el usuario
    const User = await UserModel.findOne({ StudentID });

    //Validar si la contraseña es igual a la anterior
    const isPasswordValid = await bcrypt.compare(
      StudentPassword,
      User.StudentPassword
    );

    // Si la contraseña es igual a la anterior, lanzar un error
    if (isPasswordValid) {
      //Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(StudentNewPassword, saltRounds);

      //Actualizar la contraseña
      const UpdatedUser = await UserModel.findOneAndUpdate(
        { StudentID },
        { StudentPassword: hashedPassword, IsPasswordChanged: true },
        { new: true }
      );

      return UpdatedUser;
    } else {
      throw new Error('La contraseña es incorrecta');
    }
  }
  //Actualizar Contraseña por un administrador
  static async updatePasswordbyAdmin({ StudentID, StudentNewPassword }) {
    //Validar el ID y la contraseña
    Validation.StudentID(StudentID);
    Validation.StudentPassword(StudentNewPassword);

    //Modelo de usuario
    const UserModel = mongoose.model('User', UserSchema);

    //Buscar el usuario
    const User = await UserModel.findOne({ StudentID });

    //Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(StudentNewPassword, saltRounds);

    //Actualizar la contraseña
    const UpdatedUser = await UserModel.findOneAndUpdate(
      { StudentID },
      { StudentPassword: hashedPassword, IsPasswordChanged: false },
      { new: true }
    );

    return UpdatedUser;
  }
  //Obtener todos los usuarios
  static async getAllUsers() {
    const UserModel = mongoose.model('User', UserSchema);

    const Users = await UserModel.find().select('-StudentPassword');
    return Users;
  }
}

class Validation {
  static StudentID(StudentID) {
    if (!StudentID) {
      console.error('El ID es requerido');
      throw new Error('El ID es requerido');
    }
  }

  static StudentPassword(StudentPassword) {
    if (!StudentPassword) {
      console.error('La contraseña es requerida');
      throw new Error('La contraseña es requerida');
    }
    if (typeof StudentPassword !== 'string') {
      console.error('La contraseña debe ser un string');
      throw new Error('La contraseña debe ser un string');
    }
    if (StudentPassword.length < 8) {
      console.error('La contraseña debe tener al menos 8 caracteres');
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
  }
}

module.exports = UserRepo;
