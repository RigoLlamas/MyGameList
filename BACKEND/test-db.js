require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/game');

async function testDatabase() {
    console.log('==================================================');
    console.log(' Iniciando prueba completa de conexión a MongoDB Atlas');
    console.log('==================================================');

    if (!process.env.MONGO_URI) {
        console.error('ERROR: MONGO_URI no encontrada en .env');
        process.exit(1);
    }

    try {
        console.log('1. Conectando a la base de datos...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`   -> Conectado a la base de datos "${conn.connection.name}" en ${conn.connection.host}`);

        console.log('2. Enviando ping administrativo...');
        const ping = await mongoose.connection.db.admin().ping();
        console.log(`   -> Ping resultado: ${JSON.stringify(ping)}`);

        console.log('3. Contando juegos existentes en la colección "games"...');
        const countBefore = await Game.countDocuments();
        console.log(`   -> Cantidad actual de juegos: ${countBefore}`);

        console.log('4. Probando inserción de un juego de prueba...');
        const testGame = new Game({
            titulo: 'Test Game Temporal ' + Date.now(),
            sinopsis: 'Juego temporal creado automáticamente para verificar operaciones CRUD.',
            anioSalida: '2026',
            generos: ['Test', 'Aventura'],
            plataformas: ['PC']
        });
        const saved = await testGame.save();
        console.log(`   -> Juego insertado con _id: ${saved._id}`);

        console.log('5. Verificando lectura del documento insertado...');
        const found = await Game.findById(saved._id);
        console.log(`   -> Juego encontrado: "${found.titulo}"`);

        console.log('6. Eliminando el juego de prueba para dejar la BD limpia...');
        await Game.findByIdAndDelete(saved._id);
        console.log('   -> Documento de prueba eliminado correctamente.');

        const countAfter = await Game.countDocuments();
        console.log(`   -> Cantidad final de juegos: ${countAfter} (debe ser ${countBefore})`);

        console.log('==================================================');
        console.log(' Todas las pruebas de base de datos fueron EXITOSAS!');
        console.log('==================================================');
        process.exit(0);
    } catch (err) {
        console.error('ERROR durante la prueba de la base de datos:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

testDatabase();
