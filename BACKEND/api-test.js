require('dotenv')

// BACKEND/test-steam.js
const API_KEY = "A0293D7784B9E5E2314C35753471B102";
const STEAM_ID = "76561199247482267"; // Ej. 76561198000000000

async function probarSteamAPI() {
  try {
    // 1. Obtener biblioteca de juegos del usuario
    const urlBiblioteca = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${STEAM_ID}&format=json&include_appinfo=true`;
    const resBiblioteca = await fetch(urlBiblioteca);
    const dataBiblioteca = await resBiblioteca.json();

    const juegos = dataBiblioteca.response?.games;

    if (!juegos || juegos.length === 0) {
      console.log("Conexión exitosa, pero no se encontraron juegos. Revisa que 'Detalles de los juegos' esté en Público.");
      return;
    }

    console.log(`¡Éxito! Se encontraron ${juegos.length} juegos.`);

    // Tomamos el primer juego para probar la Steam Store API y mapear datos
    const muestra = juegos[0];
    const urlDetalle = `https://store.steampowered.com/api/appdetails?appids=${muestra.appid}&l=spanish`;
    const resDetalle = await fetch(urlDetalle);
    const dataDetalle = await resDetalle.json();
    const infoTienda = dataDetalle[muestra.appid]?.data;

    // 2. Vista previa mapeada al formato de MyGameList
    const juegoMapeado = {
      steamAppId: muestra.appid,
      titulo: muestra.name,
      horasJugadas: Math.round(muestra.playtime_forever / 60),
      caratula: infoTienda?.header_image || "Sin imagen",
      sinopsis: infoTienda?.short_description || "Sin sinopsis",
      generos: infoTienda?.genres?.map((g) => g.description) || [],
      plataformas: infoTienda?.platforms || {}
    };

    console.log("\nEjemplo de juego listo para MyGameList:");
    console.dir(juegoMapeado, { depth: null });

  } catch (error) {
    console.error("Error al consultar la API de Steam:", error.message);
  }
}

probarSteamAPI();