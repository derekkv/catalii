import "server-only";
import { Environment, LogLevel, Paddle, type PaddleOptions } from "@paddle/paddle-node-sdk";

/** Instancia única del SDK de Paddle para el servidor. */
export function getPaddleInstance() {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY no está configurada");
  }
  const options: PaddleOptions = {
    environment:
      (process.env.NEXT_PUBLIC_PADDLE_ENV as Environment) ?? Environment.sandbox,
    logLevel: LogLevel.error,
  };
  return new Paddle(process.env.PADDLE_API_KEY, options);
}
