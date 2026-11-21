const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('La variable MONGO_URI no está configurada en el archivo .env');
        }

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log(`Conectado exitosamente a MongoDB Atlas (Base de datos: ${conn.connection.name})`);
        return conn;
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        throw error;
    }
};

module.exports = connectDB;
