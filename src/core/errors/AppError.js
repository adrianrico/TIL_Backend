// Error "esperado" de la aplicación: lleva status HTTP y un código estable
// que los clientes pueden usar para reaccionar.
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
