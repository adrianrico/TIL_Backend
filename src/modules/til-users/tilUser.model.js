// Modelo de los usuarios que administra el panel (usuarios de la otra web app).
import mongoose from 'mongoose';
import { generatePublicId } from '../../core/utils/ids.js';

const tilUserSchema = new mongoose.Schema(
  {
    // Identificador público único, generado por el SERVIDOR (no editable)
    publicId: { type: String, required: true, unique: true, immutable: true, default: generatePublicId },

    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    phone: { type: String, required: true, trim: true },

    // Fecha de registro automática e inmutable: el cliente no puede enviarla
    registeredAt: { type: Date, default: Date.now, immutable: true, index: true },

    // Acceso a la otra web app
    access: {
      enabled: { type: Boolean, default: false, index: true }, // toggle permitir/restringir
      username: { type: String, unique: true, sparse: true }, // se asigna al generar credenciales
      passwordHash: { type: String, select: false }, // solo hash, nunca se devuelve
      generatedAt: { type: Date, default: null },
      lastLoginAt: { type: Date, default: null },
      failedAttempts: { type: Number, default: 0, select: false },
      lockUntil: { type: Date, default: null, select: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Respuesta pública: id en lugar de _id, sin __v ni datos sensibles
      transform: (doc, ret) => {
        ret.id = String(ret._id);
        ret.access = {
          enabled: ret.access?.enabled ?? false,
          hasCredentials: Boolean(ret.access?.username),
          username: ret.access?.username ?? null,
          generatedAt: ret.access?.generatedAt ?? null,
          lastLoginAt: ret.access?.lastLoginAt ?? null,
        };
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const TilUser = mongoose.model('TilUser', tilUserSchema);
