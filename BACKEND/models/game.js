// BACKEND/models/game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  steamAppId: {
    type: Number,
    unique: true,
    sparse: true // Permite juegos creados manualmente sin ID de Steam
  },
  titulo: {
    type: String,
    required: [true, 'El título del videojuego es obligatorio'],
    trim: true
  },
  sinopsis: {
    type: String,
    default: 'Sin sinopsis disponible.'
  },
  anioSalida: {
    type: String,
    default: 'Por confirmar'
  },
  caratula: {
    type: String,
    default: ''
  },
  generos: {
    type: [String],
    default: []
  },
  plataformas: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'El videojuego debe tener al menos una plataforma asignada'
    }
  },
  promedioHoras: {
    type: Number,
    default: 0,
    min: 0
  },
  numeroFavoritos: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);