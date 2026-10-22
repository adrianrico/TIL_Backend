// Escapa caracteres especiales para usar texto del usuario dentro de un RegExp
// (evita inyección de patrones y ReDoS en las búsquedas).
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
