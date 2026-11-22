// BACKEND/models/user_game.js
const mongoose = require('mongoose');

const userGameSchema = new mongoose.Schema({
  usuarioId: {
    type: String, // Acepta ID numérico de sesión (ej. 1, 2) o ObjectId
    required: [true, 'El ID de usuario es obligatorio'],
    trim: true,
    index: true
  },
  juegoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: false
  },
  steamAppId: {
    type: Number,
    required: false,
    index: true
  },
  titulo: {
    type: String,
    required: [true, 'El título del videojuego es obligatorio'],
    trim: true
  },
  caratula: {
    type: String,
    default: ''
  },
  plataforma: {
    type: String,
    required: [true, 'La plataforma es obligatoria'],
    trim: true
  },
  estado: {
    type: String,
    enum: ['playing', 'completed', 'planned', 'dropped'],
    default: 'playing'
  },
  horasJugadas: {
    type: Number,
    default: 0,
    min: 0
  },
  progreso: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  calificacion: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  esFavorito: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Evita duplicar el mismo juego en la misma plataforma para el mismo usuario
userGameSchema.index({ usuarioId: 1, titulo: 1, plataforma: 1 }, { unique: true });

module.exports = mongoose.model('UserGame', userGameSchema);
