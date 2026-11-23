// BACKEND/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'El formato del correo electrónico no es válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
  },
  fechaNacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria']
  },
  fotoPerfil: {
    type: String,
    default: ''
  },
  favoritos: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    }],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 10,
      message: 'Solo puedes tener un máximo de 10 juegos favoritos'
    }
  },
  // Amistad unidireccional y sin aprobación (tipo "seguir"): ids de otros usuarios
  amigos: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  }
}, {
  timestamps: true // Genera createdAt automáticamente (reemplaza a joined_at para "Miembro desde")
});

// Evita devolver la contraseña al convertir el documento a JSON en las respuestas de la API
userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.password;
  return userObj;
};

module.exports = mongoose.model('User', userSchema);