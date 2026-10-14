import type { Request, Response } from "express";
import { orderService } from "@/services/order.service.js";
import type { PlaceOrderInput } from "@/schemas/order.schema.js";
import type { OrderStatus } from "@/types/database.js";
import { ApiError } from "@/lib/errors.js";
import type { AuthedRequest } from "@/types/http.js";

export const orderController = {
  /** Público: el cliente final envía su pedido. */
  async place(req: Request, res: Response) {
    const result = await orderService.place(req.body as PlaceOrderInput);
    res.status(201).json({ data: result });
  },

  async list(req: AuthedRequest, res: Response) {
    if (!req.business) throw ApiError.forbidden();
    const data = await orderService.list(req.auth.supabase, req.business.id);
    res.json({ data });
  },

  async updateStatus(req: AuthedRequest, res: Response) {
    if (!req.business) throw ApiError.forbidden();
    const { status } = req.body as { status: OrderStatus };
    const data = await orderService.updateStatus(req.auth.supabase, req.business.id, req.params.id, status);
    res.json({ data });
  },
};
