// BACKEND/controllers/mylist_api_controller.js
const mongoose = require('mongoose');
const UserGame = require('../models/user_game');
const Game = require('../models/game');
const { asegurarGenerosYPlataformas } = require('./games_api_controller');

// GET /api/mylist - Obtener la lista de juegos de un usuario (filtro opcional por estado y favorito)
const getMyList = async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId || req.headers['x-user-id'];
    const { estado, favorito } = req.query;

    if (!usuarioId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Se requiere el parámetro o cabecera de usuario (usuarioId o x-user-id).'
      });
    }

    const filtro = { usuarioId: String(usuarioId) };

    if (estado && estado !== 'all') {
      filtro.estado = estado;
    }

    if (favorito !== undefined) {
      filtro.esFavorito = favorito === 'true' || favorito === true;
    }

    const lista = await UserGame.find(filtro).sort({ updatedAt: -1 });

    // Contadores de estado para los botones de resumen
    const [totalPlaying, totalCompleted, totalPlanned, totalDropped] = await Promise.all([
      UserGame.countDocuments({ usuarioId: String(usuarioId), estado: 'playing' }),
      UserGame.countDocuments({ usuarioId: String(usuarioId), estado: 'completed' }),
      UserGame.countDocuments({ usuarioId: String(usuarioId), estado: 'planned' }),
      UserGame.countDocuments({ usuarioId: String(usuarioId), estado: 'dropped' })
    ]);

    res.json({
      ok: true,
      total: lista.length,
      contadores: {
        playing: totalPlaying,
        completed: totalCompleted,
        planned: totalPlanned,
        dropped: totalDropped
      },
      juegos: lista
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener la lista de videojuegos',
      error: error.message
    });
  }
};

// GET /api/mylist/:id - Obtener un juego específico de la lista
const getMyListGameById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de registro no válido.' });
    }

    const item = await UserGame.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado en la lista.' });
    }

    res.json({ ok: true, juego: item });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el juego de la lista',
      error: error.message
    });
  }
};

// POST /api/mylist - Agregar un videojuego a la lista personal
const addGameToMyList = async (req, res) => {
  try {
    const usuarioId = req.body.usuarioId || req.headers['x-user-id'];
    const {
      juegoId,
      steamAppId,
      titulo,
      caratula,
      plataforma,
      estado = 'playing',
      horasJugadas = 0,
      progreso = 0,
      calificacion = null,
      esFavorito = false
    } = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El usuarioId es requerido.'
      });
    }

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El título del videojuego es obligatorio.'
      });
    }

    if (!plataforma || !plataforma.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La plataforma es obligatoria.'
      });
    }

    // Comprobar si ya existe en la lista para esta plataforma
    const existente = await UserGame.findOne({
      usuarioId: String(usuarioId),
      titulo: titulo.trim(),
      plataforma: plataforma.trim()
    });

    if (existente) {
      return res.status(400).json({
        ok: false,
        mensaje: `El juego '${titulo.trim()}' ya se encuentra en tu lista para la plataforma '${plataforma.trim()}'.`
      });
    }

    const nuevoItem = new UserGame({
      usuarioId: String(usuarioId),
      juegoId: juegoId && mongoose.Types.ObjectId.isValid(juegoId) ? juegoId : undefined,
      steamAppId: steamAppId ? Number(steamAppId) : undefined,
      titulo: titulo.trim(),
      caratula: caratula || '',
      plataforma: plataforma.trim(),
      estado,
      horasJugadas: Number(horasJugadas) || 0,
      progreso: Number(progreso) || 0,
      calificacion: calificacion !== null && calificacion !== undefined && calificacion !== '' ? Number(calificacion) : null,
      esFavorito: Boolean(esFavorito)
    });

    await nuevoItem.save();
    await asegurarGenerosYPlataformas([], [nuevoItem.plataforma]);

    res.status(201).json({
      ok: true,
      mensaje: 'Videojuego agregado a tu lista exitosamente.',
      juego: nuevoItem
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      mensaje: 'No se pudo agregar el videojuego a la lista',
      error: error.message
    });
  }
};

// PUT/PATCH /api/mylist/:id - Actualizar estado, progreso, horas o calificación
const updateMyListGame = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      horasJugadas,
      hours, // Soporta alias de formulario
      progreso,
      progress, // Soporta alias de formulario
      calificacion,
      score, // Soporta alias de formulario
      esFavorito,
      plataforma
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de registro no válido.' });
    }

    const updates = {};

    if (estado !== undefined) updates.estado = estado;
    if (plataforma !== undefined) updates.plataforma = plataforma.trim();

    const horas = horasJugadas !== undefined ? horasJugadas : hours;
    if (horas !== undefined) updates.horasJugadas = Math.max(0, Number(horas) || 0);

    const prog = progreso !== undefined ? progreso : progress;
    if (prog !== undefined) updates.progreso = Math.min(100, Math.max(0, Number(prog) || 0));

    const calif = calificacion !== undefined ? calificacion : score;
    if (calif !== undefined) {
      updates.calificacion = calif === '' || calif === null ? null : Number(calif);
    }

    if (esFavorito !== undefined) {
      updates.esFavorito = Boolean(esFavorito);
    }

    const itemActualizado = await UserGame.findByIdAndUpdate(
      id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!itemActualizado) {
      return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado en la lista.' });
    }

    res.json({
      ok: true,
      mensaje: 'Progreso actualizado exitosamente.',
      juego: itemActualizado
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      mensaje: 'Error al actualizar el progreso del juego',
      error: error.message
    });
  }
};

// PATCH /api/mylist/:id/favorite - Alternar o marcar como favorito
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de registro no válido.' });
    }

    const item = await UserGame.findById(id);
    if (!item) {
      return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado en la lista.' });
    }

    item.esFavorito = !item.esFavorito;
    await item.save();

    res.json({
      ok: true,
      mensaje: item.esFavorito ? 'Marcado como favorito.' : 'Removido de favoritos.',
      esFavorito: item.esFavorito,
      juego: item
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al cambiar estado de favorito',
      error: error.message
    });
  }
};

// DELETE /api/mylist/:id - Eliminar videojuego de la lista
const deleteGameFromMyList = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de registro no válido.' });
    }

    const itemEliminado = await UserGame.findByIdAndDelete(id);

    if (!itemEliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado en la lista.' });
    }

    res.json({
      ok: true,
      mensaje: 'Videojuego eliminado de tu lista exitosamente.',
      juego: itemEliminado
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el videojuego de la lista',
      error: error.message
    });
  }
};

module.exports = {
  getMyList,
  getMyListGameById,
  addGameToMyList,
  updateMyListGame,
  toggleFavorite,
  deleteGameFromMyList
};
