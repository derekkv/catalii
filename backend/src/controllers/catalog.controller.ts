import type { Request, Response } from "express";
import { catalogService } from "@/services/catalog.service.js";
import type { CreateCatalogInput, UpdateCatalogInput } from "@/schemas/catalog.schema.js";
import { ApiError } from "@/lib/errors.js";

function ctx(req: Request) {
  if (!req.auth || !req.business) throw ApiError.forbidden();
  return { db: req.auth.supabase, business: req.business };
}

export const catalogController = {
  async list(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const data = await catalogService.list(db, business.id);
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const data = await catalogService.create(db, business, req.body as CreateCatalogInput);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const data = await catalogService.update(db, business.id, req.params.id, req.body as UpdateCatalogInput);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    const { db, business } = ctx(req);
    await catalogService.remove(db, business.id, req.params.id);
    res.status(204).end();
  },

  /** Público: no pasa por auth. */
  async storefront(req: Request, res: Response) {
    const data = await catalogService.storefront(req.params.slug);
    res.json({ data });
  },
};
