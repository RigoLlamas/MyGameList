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

    // Quitar al usuario eliminado de las listas de amigos de los demás
    await User.updateMany({ amigos: id }, { $pull: { amigos: id } });

    res.json({
      ok: true,
      mensaje: 'Cuenta eliminada permanentemente.'
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la cuenta.', error: error.message });
  }
};

// ==================== BÚSQUEDA DE USUARIOS Y AMIGOS ====================

// Solo estos campos de otros usuarios son públicos (nunca email ni fecha de nacimiento)
const CAMPOS_PUBLICOS = 'nombre fotoPerfil';

// Escapa caracteres especiales para usar el texto del usuario dentro de una expresión regular
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users?search=texto&excluir=<idPropio>
const searchUsers = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const { excluir } = req.query;

    if (!search) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe un nombre para buscar.' });
    }

    const filtro = { nombre: { $regex: escaparRegex(search), $options: 'i' } };
    if (excluir && mongoose.Types.ObjectId.isValid(excluir)) {
      filtro._id = { $ne: excluir };
    }

    const usuarios = await User.find(filtro)
      .select(CAMPOS_PUBLICOS)
      .sort({ nombre: 1 })
      .limit(20);

    res.json({ ok: true, total: usuarios.length, usuarios });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al buscar usuarios.', error: error.message });
  }
};

// GET /api/users/:id/friends
const getFriends = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario no válido.' });
    }

    const usuario = await User.findById(id).populate('amigos', CAMPOS_PUBLICOS);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }

    res.json({ ok: true, total: usuario.amigos.length, amigos: usuario.amigos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener amigos.', error: error.message });
  }
};

// POST /api/users/:id/friends/:amigoId
const addFriend = async (req, res) => {
  try {
    const { id, amigoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(amigoId)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario no válido.' });
    }
    if (id === amigoId) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes agregarte a ti mismo como amigo.' });
    }

    const [usuario, amigo] = await Promise.all([User.findById(id), User.findById(amigoId)]);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }
    if (!amigo) {
      return res.status(404).json({ ok: false, mensaje: 'El usuario que quieres agregar no existe.' });
    }
    if (usuario.amigos.some(a => a.equals(amigoId))) {
      return res.status(400).json({ ok: false, mensaje: `${amigo.nombre} ya está en tu lista de amigos.` });
    }

    const actualizado = await User.findByIdAndUpdate(
      id,
      { $addToSet: { amigos: amigoId } },
      { returnDocument: 'after' }
    ).populate('amigos', CAMPOS_PUBLICOS);

    res.status(201).json({
      ok: true,
      mensaje: `${amigo.nombre} se agregó a tus amigos.`,
      amigos: actualizado.amigos
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al agregar amigo.', error: error.message });
  }
};

// DELETE /api/users/:id/friends/:amigoId
const removeFriend = async (req, res) => {
  try {
    const { id, amigoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(amigoId)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario no válido.' });
    }

    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    }
    if (!usuario.amigos.some(a => a.equals(amigoId))) {
      return res.status(404).json({ ok: false, mensaje: 'Ese usuario no está en tu lista de amigos.' });
    }

    const actualizado = await User.findByIdAndUpdate(
      id,
      { $pull: { amigos: amigoId } },
      { returnDocument: 'after' }
    ).populate('amigos', CAMPOS_PUBLICOS);

    res.json({
      ok: true,
      mensaje: 'Amigo eliminado de tu lista.',
      amigos: actualizado.amigos
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar amigo.', error: error.message });
  }
};

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  getFriends,
  addFriend,
  removeFriend
};