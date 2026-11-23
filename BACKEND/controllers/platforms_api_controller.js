// BACKEND/controllers/platforms_api_controller.js
const mongoose = require('mongoose');
const Platform = require('../models/platform');
const Game = require('../models/game');

const MAPA_PLATAFORMAS = {
  'PC': { nombre: 'PC Master Race', codigo: 'PC', color: '#0284c7' },
  'Mac': { nombre: 'Apple Mac', codigo: 'Mac', color: '#64748b' },
  'Linux': { nombre: 'Linux', codigo: 'Linux', color: '#ea580c' },
  'Switch': { nombre: 'Nintendo Switch', codigo: 'Switch', color: '#e11d48' },
  'PS5': { nombre: 'PlayStation 5', codigo: 'PS5', color: '#2563eb' },
  'PS4': { nombre: 'PlayStation 4', codigo: 'PS4', color: '#1d4ed8' },
  'Xbox': { nombre: 'Xbox Series X/S', codigo: 'Xbox', color: '#16a34a' },
  'Xbox One': { nombre: 'Xbox One', codigo: 'Xbox One', color: '#15803d' },
  'Wii U': { nombre: 'Nintendo Wii U', codigo: 'Wii U', color: '#0891b2' }
};

// GET /api/platforms - Obtener todas las plataformas
const getPlatforms = async (req, res) => {
  try {
    let plataformas = await Platform.find().sort({ nombre: 1 });

    // Si la colección está vacía, sincronizar a partir de las plataformas de los juegos existentes
    if (plataformas.length === 0) {
      const plataformasEnJuegos = await Game.distinct('plataformas');
      for (const p of plataformasEnJuegos) {
        if (!p || !p.trim()) continue;
        const cod = p.trim();
        const meta = MAPA_PLATAFORMAS[cod] || { nombre: cod, codigo: cod, color: '#0369a1' };
        await Platform.findOneAndUpdate(
          {
            $or: [
              { codigo: { $regex: `^${cod}$`, $options: 'i' } },
              { nombre: { $regex: `^${meta.nombre}$`, $options: 'i' } }
            ]
          },
          { $setOnInsert: { nombre: meta.nombre, codigo: meta.codigo, color: meta.color } },
          { upsert: true, returnDocument: 'after' }
        );
      }
      plataformas = await Platform.find().sort({ nombre: 1 });
    }

    res.json({
      ok: true,
      total: plataformas.length,
      plataformas
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener las plataformas',
      error: error.message
    });
  }
};

// GET /api/platforms/:id - Obtener una plataforma por ID
const getPlatformById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de plataforma no válido.' });
    }

    const plataforma = await Platform.findById(id);
    if (!plataforma) {
      return res.status(404).json({ ok: false, mensaje: 'Plataforma no encontrada.' });
    }

    res.json({ ok: true, plataforma });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener la plataforma',
      error: error.message
    });
  }
};

// POST /api/platforms - Crear una nueva plataforma
const createPlatform = async (req, res) => {
  try {
    const { nombre, codigo, color } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre de la plataforma es obligatorio.'
      });
    }

    // Verificar si ya existe una plataforma con el mismo nombre (case-insensitive)
    const existe = await Platform.findOne({
      nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' }
    });

    if (existe) {
      return res.status(400).json({
        ok: false,
        mensaje: `La plataforma '${nombre.trim()}' ya existe.`
      });
    }

    const nuevaPlataforma = new Platform({
      nombre: nombre.trim(),
      codigo: codigo ? codigo.trim() : '',
      color: color && color.trim() ? color.trim() : '#0369a1'
    });

    await nuevaPlataforma.save();

    res.status(201).json({
      ok: true,
      mensaje: 'Plataforma creada exitosamente.',
      plataforma: nuevaPlataforma
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      mensaje: 'No se pudo crear la plataforma',
      error: error.message
    });
  }
};

// PUT/PATCH /api/platforms/:id - Actualizar una plataforma existente
const updatePlatform = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de plataforma no válido.' });
    }

    const updates = {};
    if (nombre !== undefined) {
      if (!nombre.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre de la plataforma no puede estar vacío.' });
      }

      // Evitar duplicados de nombre con otros registros
      const duplicado = await Platform.findOne({
        _id: { $ne: id },
        nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' }
      });

      if (duplicado) {
        return res.status(400).json({
          ok: false,
          mensaje: `Ya existe otra plataforma con el nombre '${nombre.trim()}'.`
        });
      }

      updates.nombre = nombre.trim();
    }

    if (codigo !== undefined) {
      updates.codigo = codigo.trim();
    }

    if (color !== undefined) {
      updates.color = color.trim();
    }

    const plataformaActualizada = await Platform.findByIdAndUpdate(
      id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!plataformaActualizada) {
      return res.status(404).json({ ok: false, mensaje: 'Plataforma no encontrada.' });
    }

    res.json({
      ok: true,
      mensaje: 'Plataforma actualizada exitosamente.',
      plataforma: plataformaActualizada
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      mensaje: 'Error al actualizar la plataforma',
      error: error.message
    });
  }
};

// DELETE /api/platforms/:id - Eliminar una plataforma
const deletePlatform = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de plataforma no válido.' });
    }

    const plataformaEliminada = await Platform.findByIdAndDelete(id);

    if (!plataformaEliminada) {
      return res.status(404).json({ ok: false, mensaje: 'Plataforma no encontrada.' });
    }

    res.json({
      ok: true,
      mensaje: 'Plataforma eliminada exitosamente.',
      plataforma: plataformaEliminada
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar la plataforma',
      error: error.message
    });
  }
};

module.exports = {
  getPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform
};
