const DURACION_MS = 4000;

// tipo: 'exito', 'error' o 'info'
export function avisar(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('avisos');
    if (!contenedor) return;

    const aviso = document.createElement('div');
    aviso.className = 'aviso aviso-' + tipo;
    aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    aviso.textContent = mensaje;
    contenedor.append(aviso);

    setTimeout(() => {
        aviso.classList.add('aviso-saliendo');
        aviso.addEventListener('animationend', () => aviso.remove(), { once: true });
    }, DURACION_MS);
}
