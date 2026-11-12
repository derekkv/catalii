/**
 * Error con código HTTP. El manejador central (ver middlewares/error.ts) lo
 * traduce a una respuesta JSON. Lanzar esto desde cualquier servicio/ruta en
 * vez de responder a mano mantiene el formato de error consistente.
 */
export class ApiError extends Error {
  status: number;
  /** Código corto, estable, para que el front pueda ramificar sin parsear texto. */
  code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  static unauthorized(msg = "No autorizado.") {
    return new ApiError(401, msg, "unauthorized");
  }
  static forbidden(msg = "Sin permiso.") {
    return new ApiError(403, msg, "forbidden");
  }
  static notFound(msg = "No encontrado.") {
    return new ApiError(404, msg, "not_found");
  }
  static badRequest(msg = "Solicitud inválida.") {
    return new ApiError(400, msg, "bad_request");
  }
  static conflict(msg: string) {
    return new ApiError(409, msg, "conflict");
  }
}
