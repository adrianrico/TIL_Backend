// Generador de identificadores públicos únicos para los usuarios TIL.
import { randomInt } from 'node:crypto';
import { customAlphabet } from 'nanoid';

// Alfabeto sin caracteres ambiguos (0/O, 1/I/L): 31^10 combinaciones
const nano = customAlphabet('23456789ABCDEFGHJKMNPQRSTUVWXYZ', 10);

// Ej.: TIL-8F3K2Q9XZ4. La identidad NO depende de nombre ni teléfono.
export const generatePublicId = () => `TIL-${nano()}`;

// Contraseña aleatoria criptográficamente segura (crypto.randomInt, sin sesgo).
// Alfabeto sin caracteres ambiguos; 14 caracteres ~ 69 bits de entropía.
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const generatePassword = (length = 14) =>
  Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join('');
