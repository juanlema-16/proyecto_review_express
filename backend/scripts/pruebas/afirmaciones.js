export function igual(obtenido, esperado, mensaje = 'Valor inesperado') {
    if (obtenido !== esperado) {
        throw new Error(mensaje + ': esperaba ' + JSON.stringify(esperado) + ' y llegó ' + JSON.stringify(obtenido));
    }
}

export function verdadero(condicion, mensaje = 'La condición no se cumplió') {
    if (!condicion) throw new Error(mensaje);
}

export function estado(respuesta, esperado, mensaje = 'Estado HTTP inesperado') {
    if (respuesta.estado !== esperado) {
        throw new Error(mensaje + ': esperaba ' + esperado + ' y llegó ' + respuesta.estado + ' con ' + respuesta.texto.slice(0, 300));
    }
}

export function codigoError(respuesta, estadoEsperado, codigoEsperado) {
    estado(respuesta, estadoEsperado);
    igual(respuesta.datos?.error?.codigo, codigoEsperado, 'Código de error inesperado');
}

export function sinContrasena(respuesta) {
    verdadero(!/contrasena/i.test(respuesta.texto), 'La respuesta filtró la contraseña: ' + respuesta.texto.slice(0, 200));
}

export function crearRegistro() {
    const resultados = [];
    return {
        resultados,
        grupo(nombre) {
            console.log('\n' + nombre);
        },
        async prueba(nombre, funcion) {
            try {
                await funcion();
                resultados.push({ nombre, ok: true });
                console.log('  ok    ' + nombre);
            } catch (error) {
                resultados.push({ nombre, ok: false, error });
                console.log('  FALLA ' + nombre);
                console.log('        ' + error.message);
            }
        }
    };
}
