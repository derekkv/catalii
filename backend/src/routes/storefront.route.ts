import { Router, type Request, type Response, type NextFunction } from "express";
import { catalogController } from "@/controllers/catalog.controller.js";

export const storefrontRouter = Router();

/** Wrapper async para rutas públicas (sin el tipo AuthedRequest). */
function wrap(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

// Público: la vista de catálogo que ve el cliente final.
storefrontRouter.get("/:slug", wrap(catalogController.storefront));
