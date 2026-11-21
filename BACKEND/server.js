require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./database/connection');
const routerApi = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// 1. Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../FRONTEND')));

// 2. Rutas de vistas HTML
app.get('/', (req, res) => {
    res.redirect('/views/index.html');
});
app.get('/home.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../FRONTEND/views/index.html'));
});
app.get('/login.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../FRONTEND/views/login.html'));
});

// 3. Rutas de la API
app.use('/api', routerApi);

// 4. Manejo de rutas API no encontradas (404)
app.use('/api', (req, res) => {
    res.status(404).json({
        ok: false,
        mensaje: `La ruta de API '${req.originalUrl}' no existe.`
    });
});

// 5. Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error interno del servidor:', err);
    res.status(500).json({
        ok: false,
        mensaje: 'Ocurrió un error inesperado en el servidor.',
        error: err.message
    });
});

// 6. Función para iniciar el servidor
async function startServer() {
    try {
        console.log('Conectando a la base de datos...');
        await connectDB();

        app.listen(port, () => {
            console.log('==================================================');
            console.log(` Servidor MyGameList corriendo en el puerto: ${port}`);
            console.log(` Web Frontend:        http://localhost:${port}/`);
            console.log(` Prueba Base de Datos: http://localhost:${port}/api/test-db`);
            console.log(` API Catálogo Juegos: http://localhost:${port}/api/games`);
            console.log(` API Steam:           http://localhost:${port}/api/steam/popular`);
            console.log(` API Usuarios:        http://localhost:${port}/api/users`);
            console.log('==================================================');
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor debido a un fallo en la base de datos:', error.message);
        process.exit(1);
    }
}

// Iniciar servidor solo si este archivo se ejecuta directamente
if (require.main === module) {
    startServer();
}

module.exports = app;
