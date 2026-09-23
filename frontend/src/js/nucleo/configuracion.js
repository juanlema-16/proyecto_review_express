// window.REVIEW = { api: 'https://…' } en el index.html permite apuntar a otra API
export const CONFIGURACION = {
    api: window.REVIEW?.api ?? '/api',
    version: '^1.0.0'
};
