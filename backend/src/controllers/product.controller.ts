import type { Request, Response } from "express";
import { productService } from "@/services/product.service.js";
import type { CreateProductInput, UpdateProductInput } from "@/schemas/product.schema.js";
import { ApiError } from "@/lib/errors.js";

/** Asegura que la petición pasó por requireAuth + requireBusiness. */
function ctx(req: Request) {
  if (!req.auth || !req.business) throw ApiError.forbidden();
  return { db: req.auth.supabase, business: req.business };
}

export const productController = {
  async list(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const products = await productService.list(db, business.id);
    res.json({ data: products });
  },

  async get(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const product = await productService.get(db, business.id, req.params.id);
    res.json({ data: product });
  },

  async create(req: Request, res: Response) {
    const { db, business } = ctx(req);
    // req.body ya viene validado por validateBody(createProductSchema).
    const product = await productService.create(db, business, req.body as CreateProductInput);
    res.status(201).json({ data: product });
  },

  async update(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const product = await productService.update(db, business.id, req.params.id, req.body as UpdateProductInput);
    res.json({ data: product });
  },

  async remove(req: Request, res: Response) {
    const { db, business } = ctx(req);
    await productService.remove(db, business.id, req.params.id);
    res.status(204).end();
  },
};
