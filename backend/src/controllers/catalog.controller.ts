import type { Request, Response } from "express";
import { catalogService } from "@/services/catalog.service.js";
import { createCatalogSchema, updateCatalogSchema } from "@/schemas/catalog.schema.js";
import { ApiError } from "@/lib/errors.js";
import type { AuthedRequest } from "@/types/http.js";

function requireBiz(req: AuthedRequest) {
  if (!req.business) throw ApiError.forbidden();
  return req.business;
}

export const catalogController = {
  async list(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const data = await catalogService.list(req.auth.supabase, business.id);
    res.json({ data });
  },

  async create(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const parsed = createCatalogSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos.");
    const data = await catalogService.create(req.auth.supabase, business, parsed.data);
    res.status(201).json({ data });
  },

  async update(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const parsed = updateCatalogSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos.");
    const data = await catalogService.update(req.auth.supabase, business.id, req.params.id, parsed.data);
    res.json({ data });
  },

  async remove(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    await catalogService.remove(req.auth.supabase, business.id, req.params.id);
    res.status(204).end();
  },

  /** Público: no pasa por auth. */
  async storefront(req: Request, res: Response) {
    const data = await catalogService.storefront(req.params.slug);
    res.json({ data });
  },
};
