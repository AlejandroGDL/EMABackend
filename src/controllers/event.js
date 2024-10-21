const EventRepo = require('../models/event');

// Para certificados
const User = require('../models/user');
const PDFDocument = require('pdfkit');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

//Controlador para obtener un evento
const getEvent = async (req, res) => {
  const { EventID } = req.params;

  try {
    const event = await EventRepo.findOne({ EventID });
    res.json(event);
  } catch (error) {
    res.json('Error al encontrar el evento', error.message);
  }
};

//Controlador para crear un evento
const createEvent = async (req, res) => {
  const { Title, DateandHour, Duration, Place } = req.body;
  const Image = req.file;

  try {
    await EventRepo.create({
      Title,
      DateandHour,
      Duration,
      Place,
      Image,
    });
    res.json('Evento creado exitosamente');
  } catch (error) {
    res.json(error.message);
  }
};

//Controlador para obtener todos los eventos
const getEvents = async (req, res) => {
  try {
    const events = await EventRepo.find();
    res.json(events);
  } catch (error) {
    res.json('Error al encontrar los eventos', error.message);
  }
};

//Controlador para actualizar un evento
const updateEvent = async (req, res) => {
  const { EventID } = req.params;
  const { Title, DateandHour, Duration, Place } = req.body;

  try {
    await EventRepo.update({
      EventID,
      Title,
      DateandHour,
      Duration,
      Place,
    });
    res.json('Evento actualizado');
  } catch (error) {
    res.json({
      message: 'Error al actualizar el evento',
      error: error.message,
    });
  }
};

//Controlador para eliminar un evento
const deleteEvent = async (req, res) => {
  const { EventID } = req.params;

  //Elimina el evento
  try {
    await EventRepo.delete({ EventID });
    res.json('Evento eliminado exitosamente');
  } catch (error) {
    res.json('Error al eliminar el evento', error.message);
  }
};

//Controlador para obtener el evento activo
const registerattendance = async (req, res) => {
  const { StudentID } = req.params;

  try {
    const activeEvent = await EventRepo.register({ StudentID });
    res.json(activeEvent);
  } catch (error) {
    res.json('Error al registrarte al evento', error.message);
  }
};

//Controlador para agregar a la lista de notificaciones
const addNotificationList = async (req, res) => {
  const { EventID, StudentID } = req.body;

  try {
    await EventRepo.addNotificationList({ EventID, StudentID });
    res.json('Usuario agregado a la lista de notificaciones');
  } catch (error) {
    res.json('Error al enviar la notificación', error.message);
  }
};

//Controlador para generar certificado (se hizo aquí porque se necesita el req y res)
const generateCertificate = async (req, res) => {
  const { EventID, StudentID } = req.body;

  try {
    //Buscar el evento por ID
    const event = await EventRepo.findOne({ EventID });
    if (!event) {
      console.error('El evento no existe');
      throw new Error('El evento no existe');
    }

    //Buscar el usuario por ID
    const user = await User.findOne({ StudentID });
    if (!user) {
      console.error('El usuario no existe');
      throw new Error('El usuario no existe');
    }

    //Validar que el usuario haya asistido al evento
    if (!event.Assistance.includes(user._id)) {
      console.error('El usuario no ha asistido a este evento');
      throw new Error('El usuario no ha asistido a este evento');
    }

    // Generar certificado
    const certificate = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    let pdfData = [];

    certificate.on('data', (chunk) => {
      pdfData.push(chunk);
    });

    certificate.on('end', () => {
      pdfData = Buffer.concat(pdfData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=certificado.pdf'
      );
      res.send(pdfData);
    });

    // ================== Imagenes del certificado ==================

    // Header
    certificate.image('public/CertificateIMG/Header.png', 0, 0, {
      width: 842,
      height: 192,
    });

    // Imagen TEC
    certificate.image('public/CertificateIMG/TECLogo.png', 30, 30, {
      width: 200,
      height: 60,
    });

    // Imagen GOB
    certificate.image('public/CertificateIMG/GOBLogo.png', 610, 30, {
      width: 200,
      height: 60,
    });

    // Imagen Certificado centrada
    const imagePath = 'public/CertificateIMG/Insignia.png';
    const imageWidth = 120;
    const imageHeight = 120;
    const pageWidth = certificate.page.width;
    const xPosition = (pageWidth - imageWidth) / 2;

    certificate.image(imagePath, xPosition, 420, {
      width: imageWidth,
      height: imageHeight,
    });

    // ================== Fuentes del certificado ==================

    // Register fonts once
    certificate.registerFont('Inter-Black', 'public/Fonts/Inter-Black.ttf');
    certificate.registerFont('Inter', 'public/Fonts/Inter.ttf');
    certificate.registerFont('Inter-Thin', 'public/Fonts/Inter-ThinItalic.ttf');
    certificate.registerFont(
      'Inter-SemiBold',
      'public/Fonts/Inter-SemiBold.ttf'
    );

    // ================== Contenido del certificado ==================

    certificate.moveDown(6.5);

    // Titulo del certificado
    certificate
      .font('Inter-SemiBold')
      .fontSize(44)
      .fillColor('#000000')
      .text('CERTIFICADO', { align: 'center' });

    // Subtitulo del certificado
    certificate
      .font('Inter')
      .fontSize(30)
      .fillColor('#000000')
      .text('DE PARTICIPACIÓN', { align: 'center' });

    certificate.moveDown(0.5);

    // Otorgado a en el
    certificate
      .font('Inter')
      .fontSize(16)
      .fillColor('#000000')
      .text('Otorgado a', { align: 'center' });

    certificate.moveDown(1);

    // Nombre del usuario en el certificado
    certificate
      .font('Inter-Thin')
      .fontSize(32)
      .fillColor('#000000')
      .text(`${user.StudentName} ${user.StudentLastName}`, {
        align: 'center',
        underline: true,
      });

    certificate.moveDown(0.1);

    // Nombre del evento
    certificate
      .font('Inter')
      .fontSize(14)
      .fillColor('#000000')
      .text(`En reconocimento por haber participado en el evento:`, {
        align: 'center',
      });

    // Nombre del evento
    certificate
      .font('Inter-SemiBold')
      .fontSize(14)
      .fillColor('#000000')
      .text(`${event.Title}`, {
        align: 'center',
      });

    certificate.moveDown(1);

    //Extraer fecha
    const date = new Date(event.DateandHour);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    const hora = date.getHours();
    const minutos = date.getMinutes();

    //Convertir mes a string
    switch (month) {
      case 1:
        Stringmonth = 'Enero';
        break;
      case 2:
        Stringmonth = 'Febrero';
        break;
      case 3:
        Stringmonth = 'Marzo';
        break;
      case 4:
        Stringmonth = 'Abril';
        break;
      case 5:
        Stringmonth = 'Mayo';
        break;
      case 6:
        Stringmonth = 'Junio';
        break;
      case 7:
        Stringmonth = 'Julio';
        break;
      case 8:
        Stringmonth = 'Agosto';
        break;
      case 9:
        Stringmonth = 'Septiembre';
        break;
      case 10:
        Stringmonth = 'Octubre';
        break;
      case 11:
        Stringmonth = 'Noviembre';
        break;
      case 12:
        Stringmonth = 'Diciembre';
        break;
    }

    certificate
      .font('Inter')
      .fontSize(15)
      .text(
        `El día: ${day} de ${Stringmonth} del ${year} a las ${hora}:${minutos} con una duración de: ${(
          event.Duration / 60
        ).toFixed(2)} horas`,
        {
          align: 'center',
        }
      );

    certificate.moveDown(0.5);

    // Firma del organizador
    certificate
      .font('Inter')
      .fontSize(12)
      .fillColor('#000000')
      .text('Firma del organizador', 50, 440, { align: 'left' });

    certificate
      .font('Inter')
      .fontSize(12)
      .fillColor('#000000')
      .text('______________________________________', 50, 500, {
        align: 'left',
      });

    // Firma del alumno
    certificate
      .font('Inter')
      .fontSize(12)
      .fillColor('#000000')
      .text('Firma del alumno', 100, 440, { align: 'right' });

    certificate
      .font('Inter')
      .fontSize(12)
      .fillColor('#000000')
      .text('______________________________________', 200, 500, {
        align: 'right',
      });

    // Guardar el certificado
    const pdfPath = path.join(
      __dirname,
      '../../public/PDF',
      `certificado_${event.Title}_${user.StudentName}.pdf`
    );

    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    const writeStream = fs.createWriteStream(pdfPath);

    certificate.pipe(writeStream);

    writeStream.on('error', (error) => {
      res.status(500).json({
        message: 'Error al guardar el certificado',
        error: error.message,
      });
    });

    // Finalizar el PDF
    certificate.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Realizar el registro de asistencia por QR
const registerattendancebyqr = async (req, res) => {
  const { EventID, StudentID } = req.body;

  try {
    await EventRepo.registerattendancebyqr({ StudentID, EventID });
    res.status(200).json('Asistencia registrada');
  } catch (error) {
    res.status(400).json({
      message: 'Error al registrar la asistencia',
      error: error.message,
    });
  }
};

module.exports = {
  getEvent,
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  registerattendance,
  addNotificationList,
  generateCertificate,
  registerattendancebyqr,
};
