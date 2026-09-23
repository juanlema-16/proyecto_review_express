import { body } from 'express-validator';

const correo = body('correo')
    .exists({ values: 'falsy' }).withMessage('El correo es obligatorio').bail()
    .isString().trim().toLowerCase()
    .isEmail().withMessage('El correo no tiene un formato válido');

// bcrypt solo mira los primeros 72 bytes: más largo daría una falsa sensación de seguridad
const contrasenaNueva = body('contrasena')
    .isString().withMessage('La contraseña es obligatoria').bail()
    .isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/).withMessage('La contraseña necesita al menos una letra')
    .matches(/\d/).withMessage('La contraseña necesita al menos un número');

export const alRegistrar = [
    body('nombreUsuario')
        .isString().withMessage('El nombre de usuario es obligatorio').bail()
        .trim()
        .matches(/^[A-Za-z0-9._-]{3,30}$/)
        .withMessage('El nombre de usuario debe tener de 3 a 30 letras, números, punto, guion o guion bajo'),
    correo,
    contrasenaNueva
];

export const alIniciarSesion = [
    correo,
    body('contrasena')
        .isString().withMessage('La contraseña es obligatoria').bail()
        .isLength({ min: 1, max: 72 }).withMessage('La contraseña es obligatoria')
];
