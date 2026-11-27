// BACKEND/controllers/auth_api_controller.js
const User = require('../models/user');
const { borrarFoto } = require('../middleware/subir_foto');

// POST /api/auth/register
const registerUser = async (req, res) => {
  // Si eligió foto, multer ya la guardó; esta es su ruta pública (si no, queda '')
  const fotoPerfil = req.file ? '/uploads/' + req.file.filename : '';

  try {
    const { nombre, email, password, fechaNacimiento } = req.body;

    const existeCorreo = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existeCorreo) {
      borrarFoto(fotoPerfil);   // no se creó la cuenta: la imagen sobra
      return res.status(400).json({ ok: false, mensaje: 'Ese correo electrónico ya está registrado.' });
    }

    const nuevoUsuario = new User({
      nombre,
      email,
      password,
      fechaNacimiento,
      fotoPerfil
    });

    await nuevoUsuario.save();

    // Gracias a userSchema.methods.toJSON, la contraseña no se envía en la respuesta
    res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado exitosamente.',
      usuario: nuevoUsuario
    });
  } catch (error) {
    borrarFoto(fotoPerfil);   // no se creó la cuenta: la imagen sobra
    // Captura errores de validación de Mongoose (ej. contraseña < 8 caracteres)
    const primerError = error.errors
      ? Object.values(error.errors)[0].message
      : 'Error al registrar el usuario.';
    res.status(400).json({ ok: false, mensaje: primerError });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Ingresa correo y contraseña.' });
    }

    const usuario = await User.findOne({ email: email.toLowerCase().trim() });
    if (!usuario || usuario.password !== password) {
      return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos.' });
    }

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      usuario
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en el servidor al iniciar sesión.', error: error.message });
  }
};

module.exports = { registerUser, loginUser };