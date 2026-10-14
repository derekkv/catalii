import express, { type Express } from "express";
import { healthRouter } from "@/routes/health.route.js";
import { productRouter } from "@/routes/product.route.js";
import { catalogRouter } from "@/routes/catalog.route.js";
import { storefrontRouter } from "@/routes/storefront.route.js";
import { orderRouter } from "@/routes/order.route.js";
import { notFound, errorHandler } from "@/middlewares/error.js";

/**
 * Construye la app de Express. Se separa de `server.ts` para poder montarla en
 * tests sin abrir un puerto. Los middlewares de seguridad y las rutas de
 * dominio se irán enchufando aquí.
 */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/health", healthRouter);
  app.use("/api/products", productRouter);
  app.use("/api/catalogs", catalogRouter);
  app.use("/api/storefront", storefrontRouter);
  app.use("/api/orders", orderRouter);

  // 404 y manejador de errores: SIEMPRE al final.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
