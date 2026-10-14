import type { Response } from "express";
import { productService } from "@/services/product.service.js";
import type { CreateProductInput, UpdateProductInput } from "@/schemas/product.schema.js";
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
    // req.body ya viene validado por validateBody(createProductSchema).
    const product = await productService.create(
      req.auth.supabase,
      business,
      req.body as CreateProductInput,
    );
    res.status(201).json({ data: product });
  },

  async update(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    const product = await productService.update(
      req.auth.supabase,
      business.id,
      req.params.id,
      req.body as UpdateProductInput,
    );
    res.json({ data: product });
  },

  async remove(req: AuthedRequest, res: Response) {
    const business = requireBiz(req);
    await productService.remove(req.auth.supabase, business.id, req.params.id);
    res.status(204).end();
  },
};
