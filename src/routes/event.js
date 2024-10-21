const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event');
const multer = require('multer');

//const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const upload = multer({ dest: 'public/uploads' });

//Obtener todos los eventos
router.get('/events', eventController.getEvents);
//Obtener un evento
router.get('/event/:EventID', eventController.getEvent);
//Crear eventos
router.post('/event', upload.single('Image'), eventController.createEvent);
//Actualizar eventos
router.put(
  '/event/:EventID',
  upload.single('Image'),
  eventController.updateEvent
);
//Eliminar eventos
router.delete('/event/:EventID', eventController.deleteEvent);
//Registrar asistencia a un evento
router.post('/registerevent/:StudentID', eventController.registerattendance);

//Registrar asistencia a un evento por QR
router.post('/registereventbyqr', eventController.registerattendancebyqr);

//Registrar en la lista de notificaciones
router.post('/registerlistnotify', eventController.addNotificationList);
//Generar certificado
router.post('/generatecertificate', eventController.generateCertificate);

module.exports = router;
