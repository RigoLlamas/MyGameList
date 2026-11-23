// BACKEND/controllers/genres_api_controller.js
const mongoose = require('mongoose');
const Genre = require('../models/genre');
const Game = require('../models/game');

// GET /api/genres - Obtener todos los géneros
const getGenres = async (req, res) => {
  try {
    let generos = await Genre.find().sort({ nombre: 1 });

    // Si la colección está vacía, sincronizar automáticamente a partir de los géneros existentes en los juegos
    if (generos.length === 0) {
      const generosEnJuegos = await Game.distinct('generos');
      for (const g of generosEnJuegos) {
        if (!g || !g.trim()) continue;
        const nombreG = g.trim();
        await Genre.findOneAndUpdate(
          { nombre: { $regex: `^${nombreG}$`, $options: 'i' } },
          { $setOnInsert: { nombre: nombreG, descripcion: `Género oficial: ${nombreG}` } },
          { upsert: true, returnDocument: 'after' }
        );
      }
      generos = await Genre.find().sort({ nombre: 1 });
    }

    res.json({
      ok: true,
      total: generos.length,
      generos
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener los géneros',
      error: error.message
    });
  }
};

// GET /api/genres/:id - Obtener un género por ID
const getGenreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de género no válido.' });
    }

    const genero = await Genre.findById(id);
    if (!genero) {
      return res.status(404).json({ ok: false, mensaje: 'Género no encontrado.' });
    }

    res.json({ ok: true, genero });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el género',
      error: error.message
    });
  }
};

// POST /api/genres - Crear un nuevo género
const createGenre = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre del género es obligatorio.'
      });
    }

    // Verificar si ya existe (case-insensitive)
    const existe = await Genre.findOne({
      nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' }
    });

    if (existe) {
      return res.status(400).json({
        ok: false,
        mensaje: `El género '${nombre.trim()}' ya existe.`
      });
    }

    const nuevoGenero = new Genre({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : ''
    });

    await nuevoGenero.save();

    res.status(201).json({
      ok: true,
      mensaje: 'Género creado exitosamente.',
      genero: nuevoGenero
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      mensaje: 'No se pudo crear el género',
      error: error.message
    });
  }
};

// PUT/PATCH /api/genres/:id - Actualizar un género existente
const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de género no válido.' });
    }

    const updates = {};
    if (nombre !== undefined) {
      if (!nombre.trim()) {
        return res.status(400).json({ ok: false, mensaje: 'El nombre del género no puede estar vacío.' });
      }

      // Verificar que no coincida con otro existente
      const duplicado = await Genre.findOne({
        _id: { $ne: id },
        nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' }
      });

      if (duplicado) {
        return res.status(400).json({
          ok: false,
          mensaje: `Ya existe otro género con el nombre '${nombre.trim()}'.`
        });
      }

      updates.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      updates.descripcion = descripcion.trim();
    }

    const generoActualizado = await Genre.findByIdAndUpdate(
      id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!generoActualizado) {
      return res.status(404).json({ ok: false, mensaje: 'Género no encontrado.' });
    }

    res.json({
      ok: true,
      mensaje: 'Género actualizado exitosamente.',
      genero: generoActualizado
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      mensaje: 'Error al actualizar el género',
      error: error.message
    });
  }
};

// DELETE /api/genres/:id - Eliminar un género
const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de género no válido.' });
    }

    const generoEliminado = await Genre.findByIdAndDelete(id);

    if (!generoEliminado) {
      return res.status(404).json({ ok: false, mensaje: 'Género no encontrado.' });
    }

    res.json({
      ok: true,
      mensaje: 'Género eliminado exitosamente.',
      genero: generoEliminado
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el género',
      error: error.message
    });
  }
};

module.exports = {
  getGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre
};
