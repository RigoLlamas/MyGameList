// BACKEND/clean-hardware.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./database/connection');
const Game = require('./models/game');

const HARDWARE_REGEX = /steam frame|steam machine|steam deck|valve index|docking station|steam controller|steam link|vr headset|dev kit|soundtrack|artbook/i;

async function limpiarHardware() {
  await connectDB();

  const resultado = await Game.deleteMany({
    $or: [
      { titulo: { $regex: HARDWARE_REGEX } },
      { generos: { $in: [/hardware/i, /utilidades/i, /utilities/i] } }
    ]
  });

  console.log(`Registros de hardware/consolas eliminados: ${resultado.deletedCount}`);
  await mongoose.connection.close();
}

limpiarHardware();