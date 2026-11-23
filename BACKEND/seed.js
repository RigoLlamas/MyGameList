require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/game');
const Genre = require('./models/genre');
const Platform = require('./models/platform');

const generosIniciales = [
  { nombre: 'Aventura', descripcion: 'Exploración, resolución de misterios y narrativa.' },
  { nombre: 'Acción', descripcion: 'Enfocado en desafíos físicos, combate y reflejos.' },
  { nombre: 'RPG', descripcion: 'Rol, desarrollo y personalización de personajes.' },
  { nombre: 'Mundo Abierto', descripcion: 'Mundos extensos no lineales con libertad de exploración.' },
  { nombre: 'Roguelike', descripcion: 'Niveles generados por procedimientos y muerte permanente.' },
  { nombre: 'Metroidvania', descripcion: 'Exploración no lineal con adquisición progresiva de habilidades.' },
  { nombre: 'Simulación', descripcion: 'Recreación realista de actividades de la vida o gestión.' },
  { nombre: 'Puzle', descripcion: 'Resolución de acertijos lógicos y mentales.' }
];

const plataformasIniciales = [
  { nombre: 'PC Master Race', codigo: 'PC', color: '#0284c7' },
  { nombre: 'Nintendo Switch', codigo: 'Switch', color: '#e11d48' },
  { nombre: 'PlayStation 5', codigo: 'PS5', color: '#2563eb' },
  { nombre: 'Xbox Series X/S', codigo: 'Xbox', color: '#16a34a' },
  { nombre: 'Nintendo Wii U', codigo: 'Wii U', color: '#0891b2' }
];

const juegosIniciales = [
  {
    titulo: 'The Legend of Zelda: Breath of the Wild',
    sinopsis: 'Despierta tras un letargo de 100 años y viaja por un vasto mundo abierto en esta aventura legendaria.',
    anioSalida: '2017',
    caratula: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    generos: ['Aventura', 'Mundo Abierto'],
    plataformas: ['Switch', 'Wii U'],
    promedioHoras: 50,
    numeroFavoritos: 12345
  },
  {
    steamAppId: 1245620,
    titulo: 'Elden Ring',
    sinopsis: 'Álzate, Sinluz, y déjate guiar por la gracia para esgrimir el poder del Círculo de Elden en las Tierras Intermedias.',
    anioSalida: '2022',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
    generos: ['RPG', 'Acción', 'Mundo Abierto'],
    plataformas: ['PC', 'PS5', 'Xbox'],
    promedioHoras: 60,
    numeroFavoritos: 28900
  },
  {
    steamAppId: 1086940,
    titulo: "Baldur's Gate 3",
    sinopsis: 'Reúne a tu grupo y regresa a los Reinos Olvidados en una historia de compañerismo, traición y sacrificio.',
    anioSalida: '2023',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg',
    generos: ['RPG', 'Aventura'],
    plataformas: ['PC', 'PS5', 'Xbox'],
    promedioHoras: 75,
    numeroFavoritos: 21300
  },
  {
    steamAppId: 1687950,
    titulo: 'Persona 5 Royal',
    sinopsis: 'Ponte la máscara de Joker y únete a los Ladrones Fantasma de Corazones para cambiar el mundo.',
    anioSalida: '2020',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1687950/header.jpg',
    generos: ['RPG', 'Acción'],
    plataformas: ['PC', 'PS5', 'Switch', 'Xbox'],
    promedioHoras: 100,
    numeroFavoritos: 15400
  },
  {
    steamAppId: 1145360,
    titulo: 'Hades',
    sinopsis: 'Desafía al dios de los muertos mientras combates para escapar del Inframundo en este roguelike de acción.',
    anioSalida: '2020',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg',
    generos: ['Roguelike', 'Acción'],
    plataformas: ['PC', 'Switch', 'PS5', 'Xbox'],
    promedioHoras: 25,
    numeroFavoritos: 18200
  },
  {
    steamAppId: 413150,
    titulo: 'Stardew Valley',
    sinopsis: 'Heredaste la vieja parcela agrícola de tu abuelo en Stardew Valley. ¡Es hora de empezar tu nueva vida!',
    anioSalida: '2016',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg',
    generos: ['Simulación', 'RPG'],
    plataformas: ['PC', 'Switch', 'PS5', 'Xbox'],
    promedioHoras: 80,
    numeroFavoritos: 31000
  },
  {
    steamAppId: 1091500,
    titulo: 'Cyberpunk 2077',
    sinopsis: 'Un RPG de acción y aventura en mundo abierto ambientado en Night City, una megalópolis obsesionada con el poder y las modificaciones corporales.',
    anioSalida: '2020',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
    generos: ['Mundo Abierto', 'RPG', 'Acción'],
    plataformas: ['PC', 'PS5', 'Xbox'],
    promedioHoras: 40,
    numeroFavoritos: 19800
  },
  {
    steamAppId: 367520,
    titulo: 'Hollow Knight',
    sinopsis: 'Forja tu propio camino en Hollow Knight, una aventura de acción clásica en 2D a través de un vasto reino en ruinas de insectos y héroes.',
    anioSalida: '2017',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg',
    generos: ['Metroidvania', 'Acción', 'Aventura'],
    plataformas: ['PC', 'Switch', 'PS5', 'Xbox'],
    promedioHoras: 30,
    numeroFavoritos: 24500
  },
  {
    steamAppId: 620,
    titulo: 'Portal 2',
    sinopsis: 'La iniciativa de pruebas perpetuas se ha ampliado para permitirte diseñar rompecabezas para ti y tus amigos.',
    anioSalida: '2011',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg',
    generos: ['Puzle', 'Aventura'],
    plataformas: ['PC'],
    promedioHoras: 10,
    numeroFavoritos: 35000
  },
  {
    steamAppId: 1174180,
    titulo: 'Red Dead Redemption 2',
    sinopsis: 'América, 1899. Arthur Morgan y la banda de Van der Linde se ven forzados a huir.',
    anioSalida: '2019',
    caratula: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
    generos: ['Mundo Abierto', 'Aventura', 'Acción'],
    plataformas: ['PC', 'PS5', 'Xbox'],
    promedioHoras: 65,
    numeroFavoritos: 42000
  }
];

async function seedDatabase() {
  console.log('==================================================');
  console.log(' SEEDING: Población Inicial de la Base de Datos');
  console.log('==================================================');

  if (!process.env.MONGO_URI) {
    console.error('ERROR: MONGO_URI no encontrada en .env');
    process.exit(1);
  }

  try {
    console.log('1. Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('   -> Conectado exitosamente.');

    // 1. Población de Géneros
    console.log('2. Insertando géneros...');
    for (const g of generosIniciales) {
      await Genre.findOneAndUpdate(
        { nombre: g.nombre },
        { $setOnInsert: g },
        { upsert: true, returnDocument: 'after' }
      );
    }
    const countGeneros = await Genre.countDocuments();
    console.log(`   -> Total géneros disponibles: ${countGeneros}`);

    // 2. Población de Plataformas
    console.log('3. Insertando plataformas...');
    for (const p of plataformasIniciales) {
      await Platform.findOneAndUpdate(
        { nombre: p.nombre },
        { $setOnInsert: p },
        { upsert: true, returnDocument: 'after' }
      );
    }
    const countPlataformas = await Platform.countDocuments();
    console.log(`   -> Total plataformas disponibles: ${countPlataformas}`);

    // 3. Población de Juegos
    console.log('4. Insertando catálogo inicial de videojuegos...');
    for (const j of juegosIniciales) {
      const filtro = j.steamAppId ? { steamAppId: j.steamAppId } : { titulo: j.titulo };
      await Game.findOneAndUpdate(
        filtro,
        { $setOnInsert: j },
        { upsert: true, returnDocument: 'after' }
      );
    }
    const countJuegos = await Game.countDocuments();
    console.log(`   -> Total videojuegos en catálogo: ${countJuegos}`);

    console.log('==================================================');
    console.log(' BASE DE DATOS POBLADA EXITOSAMENTE!');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('ERROR al poblar la base de datos:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
