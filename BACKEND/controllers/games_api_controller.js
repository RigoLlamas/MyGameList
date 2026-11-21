// BACKEND/controllers/games_api_controller.js
const mongoose = require('mongoose');
const Game = require('../models/game');

// GET /api/games?search=&genre=&platform=&sort=popularidad&page=1&limit=8
const getGames = async (req, res) => {
  try {
    const {
      search = '',
      genre = '',
      platform = '',
      sort = 'popularidad',
      page = 1,
      limit = 8
    } = req.query;

    const filtro = {};

    if (search.trim()) {
      filtro.titulo = { $regex: search.trim(), $options: 'i' };
    }
    if (genre && genre !== 'todos') {
      filtro.generos = { $regex: `^${genre}$`, $options: 'i' };
    }
    if (platform && platform !== 'todas') {
      filtro.plataformas = { $regex: `^${platform}$`, $options: 'i' };
    }

    // Criterios de ordenamiento
    let orden = { numeroFavoritos: -1 };
    if (sort === 'nombre') orden = { titulo: 1 };
    if (sort === 'anio') orden = { anioSalida: -1 };
    if (sort === 'horas') orden = { promedioHoras: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [juegos, total] = await Promise.all([
      Game.find(filtro).sort(orden).skip(skip).limit(limitNum),
      Game.countDocuments(filtro)
    ]);

    res.json({
      ok: true,
      total,
      paginaActual: pageNum,
      totalPaginas: Math.ceil(total / limitNum) || 1,
      juegos
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el catálogo', error: error.message });
  }
};

// GET /api/games/:id (Acepta _id de MongoDB o steamAppId)
const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    let juego = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      juego = await Game.findById(id);
    }
    if (!juego && !isNaN(id)) {
      juego = await Game.findOne({ steamAppId: Number(id) });
    }

    if (!juego) {
      return res.status(404).json({ ok: false, mensaje: 'Videojuego no encontrado.' });
    }

    res.json({ ok: true, juego });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener detalle del juego', error: error.message });
  }
};

// POST /api/games (Crear entrada manual en catálogo)
const createGame = async (req, res) => {
  try {
    const nuevoJuego = new Game(req.body);
    await nuevoJuego.save();
    res.status(201).json({ ok: true, juego: nuevoJuego });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: 'No se pudo crear el juego', error: error.message });
  }
};

module.exports = {
  getGames,
  getGameById,
  createGame
};