const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/event');

const schedule = require('node-schedule');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', userRoutes);
app.use('/api', eventRoutes);
app.use('/', express.static('public'));

//Ruta principal
app.get('/', (req, res) => {
  res.send('Ok');
});

//Borrar certificados cada 24 horas a las 00:00
const rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.minute = 0;
rule.second = 0;

schedule.scheduleJob(rule, () => {
  const directory = path.join(__dirname, '../public/PDF');

  fs.promises
    .access(directory, fs.constants.F_OK)
    .then(() => fs.promises.readdir(directory))
    .then((files) => {
      if (files.length === 0) {
        console.log('No hay PDFs para eliminar.');
        return;
      }
      return Promise.all(
        files.map((file) => fs.promises.unlink(path.join(directory, file)))
      );
    })
    .then(() => {
      console.log('Todos los PDFs fueron eliminados correctamente.');
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        console.log('La carpeta no existe.');
      } else {
        console.error('Error al acceder o al eliminar los archivos:', err);
      }
    });
});

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch((err) => console.error('No se pudo conectar a MongoDB', err));

app.listen(port, () => {
  console.log('Servidor ejecutandose en: http://localhost:' + port);
});
