// BACKEND/middleware/subir_foto.js
// Todo lo de fotos de perfil en un solo lugar: lo usan el registro y la edición del perfil.
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const CARPETA_UPLOADS = path.join(__dirname, '../uploads');

// Dónde y con qué nombre se guarda la imagen (nombre único: fecha en milisegundos + extensión)
const storage = multer.diskStorage({
  destination: CARPETA_UPLOADS,                               // multer crea la carpeta si no existe
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 },                          // máximo 1 MB
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')) // solo imágenes
});

// Middleware: recibe el campo "fotoPerfil" (opcional) y deja la imagen en req.file.
// Envuelve a multer para que sus errores (p. ej. imagen de más de 1 MB)
// respondan 400 con un mensaje claro en vez de un 500 genérico.
const subirFoto = (req, res, next) => {
  upload.single('fotoPerfil')(req, res, (err) => {
    if (err) {
      const mensaje = err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no puede pesar más de 1 MB.'
        : 'No se pudo subir la imagen.';
      return res.status(400).json({ ok: false, mensaje });
    }
    next();
  });
};

// Borra del disco una foto guardada en /uploads (si la hay).
// path.basename evita que una ruta rara apunte fuera de la carpeta uploads.
function borrarFoto(ruta) {
  if (!ruta || !ruta.startsWith('/uploads/')) return;
  fs.unlink(path.join(CARPETA_UPLOADS, path.basename(ruta)), () => {});
}

module.exports = { subirFoto, borrarFoto };
