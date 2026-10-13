import type { Response } from "express";
import { productService } from "@/services/product.service.js";
import { createProductSchema, updateProductSchema } from "@/schemas/product.schema.js";
import { ApiError } from "@/lib/errors.js";
import type { AuthedRequest } from "@/types/http.js";

function requireBiz(req: AuthedRequest) {
  if (!req.business) throw ApiError.forbidden();
  return req.business;
}

export const productController = {
  async list(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const products = await productService.list(req.auth.supabase, business.id);
    res.json({ data: products });
  },

  async get(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const product = await productService.get(req.auth.supabase, business.id, req.params.id);
    res.json({ data: product });
  },

  async create(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos.");
    const product = await productService.create(req.auth.supabase, business, parsed.data);
    res.status(201).json({ data: product });
  },

  async update(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Datos inválidos.");
    const product = await productService.update(req.auth.supabase, business.id, req.params.id, parsed.data);
    res.json({ data: product });
  },

  async remove(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    await productService.remove(req.auth.supabase, business.id, req.params.id);
    res.status(204).end();
  },
};
