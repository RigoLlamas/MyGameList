// BACKEND/controllers/users_api_controller.js
const mongoose = require('mongoose');
const User = require('../models/user');

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario no válido.' });
    }

    const usuario = await User.findById(id).populate('favoritos');
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    res.json({ ok: true, usuario });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener perfil.', error: error.message });
  }
};

// PUT /api/users/:id (Actualizar foto de perfil, fecha de nacimiento o nombre)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario no válido.' });
    }

    const { nombre, fechaNacimiento, fotoPerfil } = req.body;
    const cambios = {};

    if (nombre !== undefined) cambios.nombre = nombre;
    if (fechaNacimiento !== undefined) cambios.fechaNacimiento = fechaNacimiento;
    if (fotoPerfil !== undefined) cambios.fotoPerfil = fotoPerfil;

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ ok: false, mensaje: 'No se enviaron campos para actualizar.' });
    }

    const usuarioActualizado = await User.findByIdAndUpdate(
      id,
      cambios,
      { returnDocument: 'after', runValidators: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    res.json({
      ok: true,
      mensaje: 'Perfil actualizado correctamente.',
      usuario: usuarioActualizado
    });
  } catch (error) {
    const primerError = error.errors
      ? Object.values(error.errors)[0].message
      : 'Error al actualizar el perfil.';
    res.status(400).json({ ok: false, mensaje: primerError });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario no válido.' });
    }

    const usuarioEliminado = await User.findByIdAndDelete(id);
    if (!usuarioEliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    res.json({
      ok: true,
      mensaje: 'Cuenta eliminada permanentemente.'
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la cuenta.', error: error.message });
  }
};

module.exports = { getUserById, updateUser, deleteUser };