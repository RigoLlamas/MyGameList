// BACKEND/models/platform.js
const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la plataforma es obligatorio'],
    unique: true,
    trim: true
  },
  codigo: {
    type: String,
    trim: true,
    default: '' // Ej: "PC", "PS5", "Switch", "Xbox"
  },
  color: {
    type: String,
    default: '#0369a1', // Color hexadecimal para el badge o etiqueta
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Platform', platformSchema);
