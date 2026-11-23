// BACKEND/controllers/games_api_controller.js
const mongoose = require('mongoose');
const Game = require('../models/game');
const Genre = require('../models/genre');
const Platform = require('../models/platform');
const UserGame = require('../models/user_game')

// Mapa de plataformas conocidas con colores y nombres descriptivos
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

// Helper para normalizar plataformas de Steam a nombres estándar
function mapearPlataformasSteam(platformsObj = {}) {
  const plataformas = [];
  if (platformsObj.windows) plataformas.push('PC');
  if (platformsObj.mac) plataformas.push('Mac');
  if (platformsObj.linux) plataformas.push('Linux');
  return plataformas.length > 0 ? plataformas : ['PC'];
}

// Sincroniza automáticamente los géneros y plataformas en sus respectivas colecciones de MongoDB
async function asegurarGenerosYPlataformas(generos = [], plataformas = []) {
  try {
    // 1. Guardar géneros nuevos en la colección Genre
    for (const g of generos) {
      if (!g || !g.trim()) continue;
      const nombreG = g.trim();
      await Genre.findOneAndUpdate(
        { nombre: { $regex: `^${nombreG}$`, $options: 'i' } },
        {
          $setOnInsert: {
            nombre: nombreG,
            descripcion: `Género oficial: ${nombreG}`
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // 2. Guardar plataformas nuevas en la colección Platform
    for (const p of plataformas) {
      if (!p || !p.trim()) continue;
      const cod = p.trim();
      const meta = MAPA_PLATAFORMAS[cod] || {
        nombre: cod,
        codigo: cod,
        color: '#0369a1'
      };

      await Platform.findOneAndUpdate(
        {
          $or: [
            { codigo: { $regex: `^${cod}$`, $options: 'i' } },
            { nombre: { $regex: `^${meta.nombre}$`, $options: 'i' } }
          ]
        },
        {
          $setOnInsert: {
            nombre: meta.nombre,
            codigo: meta.codigo,
            color: meta.color
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (error) {
    console.error('Error al sincronizar taxonomías (géneros/plataformas):', error.message);
  }
}

// Helper: Obtiene el detalle de un juego desde Steam Store API y lo persiste en MongoDB
async function obtenerODescargarDetalleSteam(appid) {
  try {
    const appIdNum = Number(appid);
    if (!appIdNum || isNaN(appIdNum)) return null;

    // Verificar si ya existe en MongoDB
    let juegoExistente = await Game.findOne({ steamAppId: appIdNum });
    if (juegoExistente) {
      await asegurarGenerosYPlataformas(juegoExistente.generos, juegoExistente.plataformas);
      return juegoExistente;
    }

    const url = `https://store.steampowered.com/api/appdetails?appids=${appIdNum}&l=spanish`;
    const response = await fetch(url);
    const data = await response.json();

    const appData = data[appIdNum];
    if (!appData || !appData.success || !appData.data) return null;

    const info = appData.data;
    const anio = info.release_date?.date ? String(info.release_date.date).slice(-4) : '2024';
    const generosExtraidos = info.genres && info.genres.length > 0
      ? info.genres.map((g) => g.description)
      : ['Acción'];
    const plataformasExtraidas = mapearPlataformasSteam(info.platforms);

    const juegoDoc = {
      steamAppId: appIdNum,
      titulo: info.name,
      sinopsis: info.short_description || 'Sin sinopsis disponible.',
      anioSalida: !isNaN(anio) && anio.length === 4 ? anio : '2024',
      caratula: info.header_image || '',
      generos: generosExtraidos,
      plataformas: plataformasExtraidas,
      promedioHoras: 0,
      numeroFavoritos: 0
    };

    const juegoGuardado = await Game.findOneAndUpdate(
      { steamAppId: appIdNum },
      { $setOnInsert: juegoDoc },
      { upsert: true, returnDocument: 'after' }
    );

    // Sincronizar géneros y plataformas en sus colecciones para las secciones 6 y 7
    if (juegoGuardado) {
      await asegurarGenerosYPlataformas(juegoGuardado.generos, juegoGuardado.plataformas);
    }

    return juegoGuardado;
  } catch (error) {
    console.error(`Error al consultar detalle de Steam para AppID ${appid}:`, error.message);
    return null;
  }
}

// Helper: Auto-poblar catálogo con juegos destacados y más vendidos de Steam
async function autoPoblarCatalogoDesdeSteam() {
  try {
    const url = 'https://store.steampowered.com/api/featuredcategories?l=spanish';
    const response = await fetch(url);
    const data = await response.json();

    const topSellers = data.top_sellers?.items || [];
    const specials = data.specials?.items || [];
    const items = [...topSellers, ...specials].slice(0, 12);

    for (const item of items) {
      if (item && item.id) {
        await obtenerODescargarDetalleSteam(item.id);
      }
    }
  } catch (error) {
    console.error('Error al auto-poblar catálogo desde Steam:', error.message);
  }
}

// Helper: Buscar en la tienda de Steam y guardar los resultados en MongoDB
async function buscarEnSteamYGuardar(searchTerm) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchTerm)}&l=spanish&cc=MX`;
    const response = await fetch(url);
    const data = await response.json();

    const items = (data.items || []).slice(0, 6);
    for (const item of items) {
      if (item && item.id) {
        await obtenerODescargarDetalleSteam(item.id);
      }
    }
  } catch (error) {
    console.error(`Error al buscar "${searchTerm}" en Steam:`, error.message);
  }
}

// GET /api/games?search=&genre=&platform=&sort=popularidad&page=1&limit=8&sync=
const getGames = async (req, res) => {
  try {
    const {
      search = '',
      genre = '',
      platform = '',
      sort = 'popularidad',
      page = 1,
      limit = 8,
      sync = 'false'
    } = req.query;

    let totalActual = await Game.countDocuments();

    // 1. Si la base de datos está vacía o se solicita explícitamente ?sync=true, jala juegos de Steam
    if (totalActual === 0 || sync === 'true' || sync === 'steam') {
      await autoPoblarCatalogoDesdeSteam();
      totalActual = await Game.countDocuments();
    }

    // 2. Si se busca por término y no hay coincidencias locales, busca en Steam y las almacena
    if (search.trim()) {
      const coincidenciasLocales = await Game.countDocuments({
        titulo: { $regex: search.trim(), $options: 'i' }
      });
      if (coincidenciasLocales === 0) {
        await buscarEnSteamYGuardar(search.trim());
      }
    }

    // Construcción del filtro para MongoDB
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

// GET /api/games/:id (Acepta _id de MongoDB o steamAppId, y si no existe lo jala de Steam)
const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    let juego = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      juego = await Game.findById(id);
    }
    if (!juego && !isNaN(id)) {
      juego = await Game.findOne({ steamAppId: Number(id) });
      // Si no está en MongoDB, jalarlo directamente de Steam Store API
      if (!juego) {
        juego = await obtenerODescargarDetalleSteam(Number(id));
      }
    }

    if (!juego) {
      return res.status(404).json({ ok: false, mensaje: 'Videojuego no encontrado.' });
    }

    // Asegurar que sus géneros y plataformas estén registrados
    await asegurarGenerosYPlataformas(juego.generos, juego.plataformas);

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
    await asegurarGenerosYPlataformas(nuevoJuego.generos, nuevoJuego.plataformas);
    res.status(201).json({ ok: true, juego: nuevoJuego });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: 'No se pudo crear el juego', error: error.message });
  }
};

// GET /api/games/sync-steam (Forzar sincronización explícita del catálogo desde Steam)
const syncSteamCatalog = async (req, res) => {
  try {
    const steamId = req.query.steamId;
    const apiKey = process.env.STEAM_API_KEY;

    if (steamId && apiKey) {
      const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=true`;
      const response = await fetch(url);
      const data = await response.json();
      const owned = (data.response?.games || []).slice(0, 15);

      for (const g of owned) {
        if (g && g.appid) {
          await obtenerODescargarDetalleSteam(g.appid);
        }
      }
    } else {
      await autoPoblarCatalogoDesdeSteam();
    }

    const total = await Game.countDocuments();
    res.json({
      ok: true,
      mensaje: 'Catálogo sincronizado exitosamente con la API de Steam.',
      totalJuegos: total
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al sincronizar catálogo con Steam', error: error.message });
  }
};

// GET /api/games/:id/stats — estadísticas de la comunidad para un juego
const getGameStats = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de juego no válido.' });
    }

    const juego = await Game.findById(id);
    if (!juego) {
      return res.status(404).json({ ok: false, mensaje: 'Videojuego no encontrado.' });
    }

    // Registros de Mi Lista de TODOS los usuarios que tienen este juego
    const filtro = { $or: [{ juegoId: juego._id }] };
    if (juego.steamAppId) filtro.$or.push({ steamAppId: juego.steamAppId });
    const registros = await UserGame.find(filtro);

    // Contar por estado y promediar calificaciones
    const conteo = { playing: 0, completed: 0, planned: 0, dropped: 0 };
    let sumaCalificaciones = 0;
    let totalCalificaciones = 0;

    registros.forEach(registro => {
      conteo[registro.estado]++;
      if (registro.calificacion !== null) {
        sumaCalificaciones += registro.calificacion;
        totalCalificaciones++;
      }
    });

    res.json({
      ok: true,
      estadisticas: {
        totalEnListas: registros.length,
        jugando: conteo.playing,
        completados: conteo.completed,
        planeados: conteo.planned,
        abandonados: conteo.dropped,
        calificacionMedia: totalCalificaciones > 0
          ? Number((sumaCalificaciones / totalCalificaciones).toFixed(1))
          : null,
        totalCalificaciones
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener estadísticas', error: error.message });
  }
};

module.exports = {
  getGames,
  getGameById,
  createGame,
  syncSteamCatalog,
  asegurarGenerosYPlataformas,
  MAPA_PLATAFORMAS,
  getGameStats
};
