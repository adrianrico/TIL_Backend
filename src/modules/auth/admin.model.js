// Modelo del administrador del panel (ej. MAYLOB_CONTROL).
import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    // Hash bcrypt: jamás se devuelve en consultas (select: false)
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['superadmin'], default: 'superadmin' },

    // Protección contra fuerza bruta
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    lastLoginAt: { type: Date, default: null },

    // Hash (sha256) del identificador (jti) del refresh token vigente.
    // Permite rotar el token y detectar reutilización.
    refreshJtiHash: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

export const Admin = mongoose.model('Admin', adminSchema);
