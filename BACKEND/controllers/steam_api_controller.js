const Game = require('../models/game');

// Helper para normalizar plataformas booleanas de Steam a nombres del sistema
function mapearPlataformasSteam(platformsObj = {}) {
  const plataformas = [];
  if (platformsObj.windows) plataformas.push('PC');
  if (platformsObj.mac) plataformas.push('Mac');
  if (platformsObj.linux) plataformas.push('Linux');
  return plataformas.length > 0 ? plataformas : ['PC'];
}

// GET /api/steam/search?term=zelda
const searchSteamGames = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim() === '') {
      return res.status(400).json({ ok: false, mensaje: 'Debes enviar el parámetro "term" para buscar.' });
    }

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=spanish&cc=MX`;
    const response = await fetch(url);
    const data = await response.json();

    const resultados = (data.items || []).map((item) => ({
      steamAppId: item.id,
      titulo: item.name,
      caratula: item.tiny_image,
      plataformas: mapearPlataformasSteam(item.platforms)
    }));

    res.json({ ok: true, total: data.total || resultados.length, juegos: resultados });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al buscar en Steam', error: error.message });
  }
};

// GET /api/steam/game/:appid (Obtiene detalle de Steam y lo guarda/actualiza en MongoDB)
const getSteamGameDetail = async (req, res) => {
  try {
    const { appid } = req.params;

    // 1. Verificar si ya existe en caché de MongoDB
    let juegoExistente = await Game.findOne({ steamAppId: Number(appid) });
    if (juegoExistente) {
      return res.json({ ok: true, fuente: 'database', juego: juegoExistente });
    }

    // 2. Consultar Steam Store API si no está guardado
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=spanish`;
    const response = await fetch(url);
    const data = await response.json();

    const appData = data[appid];
    if (!appData || !appData.success) {
      return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado en Steam.' });
    }

    const info = appData.data;
    const nuevoJuego = new Game({
      steamAppId: Number(appid),
      titulo: info.name,
      sinopsis: info.short_description || 'Sin sinopsis disponible.',
      anioSalida: info.release_date?.date || 'Sin fecha',
      caratula: info.header_image || '',
      generos: info.genres ? info.genres.map((g) => g.description) : [],
      plataformas: mapearPlataformasSteam(info.platforms),
      promedioHoras: 0,
      numeroFavoritos: 0
    });

    await nuevoJuego.save();
    res.json({ ok: true, fuente: 'steam', juego: nuevoJuego });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener detalle de Steam', error: error.message });
  }
};

// GET /api/steam/popular (Para Juegos Populares en index.html)
const getPopularSteamGames = async (req, res) => {
  try {
    const url = 'https://store.steampowered.com/api/featuredcategories?l=spanish';
    const response = await fetch(url);
    const data = await response.json();

    const populares = (data.top_sellers?.items || []).slice(0, 8).map((item) => ({
      steamAppId: item.id,
      titulo: item.name,
      caratula: item.large_capsule_image || item.header_image
    }));

    res.json({ ok: true, juegos: populares });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener populares de Steam', error: error.message });
  }
};

// GET /api/steam/owned/:steamId (Endpoint listo para que Diego Uribe sincronice bibliotecas)
const getUserOwnedGames = async (req, res) => {
  try {
    const { steamId } = req.params;
    const apiKey = process.env.STEAM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ ok: false, mensaje: 'STEAM_API_KEY no configurada en .env' });
    }

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=true`;
    const response = await fetch(url);
    const data = await response.json();

    const juegos = (data.response?.games || []).map((g) => ({
      steamAppId: g.appid,
      titulo: g.name,
      horasJugadas: Math.round((g.playtime_forever || 0) / 60)
    }));

    res.json({ ok: true, total: juegos.length, juegos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al consultar biblioteca de Steam', error: error.message });
  }
};

module.exports = {
  searchSteamGames,
  getSteamGameDetail,
  getPopularSteamGames,
  getUserOwnedGames
};