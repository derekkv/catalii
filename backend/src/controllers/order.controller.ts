import type { Request, Response } from "express";
import { orderService } from "@/services/order.service.js";
import { placeOrderSchema, updateStatusSchema } from "@/schemas/order.schema.js";
import { ApiError } from "@/lib/errors.js";
import type { AuthedRequest } from "@/types/http.js";

export const orderController = {
  /** Público: el cliente final envía su pedido. */
  async place(req: Request, res: Response) {
    const parsed = placeOrderSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message ?? "Datos del pedido inválidos.");
    const result = await orderService.place(parsed.data);
    res.status(201).json({ data: result });
  },

  async list(req: AuthedRequest, res: Response) {
    if (!req.business) throw ApiError.forbidden();
    const data = await orderService.list(req.auth.supabase, req.business.id);
    res.json({ data });
  },

  async updateStatus(req: AuthedRequest, res: Response) {
    if (!req.business) throw ApiError.forbidden();
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Estado inválido.");
    const data = await orderService.updateStatus(
      req.auth.supabase,
      req.business.id,
      req.params.id,
      parsed.data.status,
    );
    res.json({ data });
  },
};
