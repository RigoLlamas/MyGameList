// BACKEND/models/genre.js
const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del género es obligatorio'],
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Genre', genreSchema);
