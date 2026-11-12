import type { Request, Response } from "express";
import { orderService } from "@/services/order.service.js";
import type { PlaceOrderInput } from "@/schemas/order.schema.js";
import type { OrderStatus } from "@/types/database.js";
import { ApiError } from "@/lib/errors.js";

function ctx(req: Request) {
  if (!req.auth || !req.business) throw ApiError.forbidden();
  return { db: req.auth.supabase, business: req.business };
}

export const orderController = {
  /** Público: el cliente final envía su pedido. */
  async place(req: Request, res: Response) {
    const result = await orderService.place(req.body as PlaceOrderInput);
    res.status(201).json({ data: result });
  },

  async list(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const data = await orderService.list(db, business.id);
    res.json({ data });
  },

  async updateStatus(req: Request, res: Response) {
    const { db, business } = ctx(req);
    const { status } = req.body as { status: OrderStatus };
    const data = await orderService.updateStatus(db, business.id, req.params.id, status);
    res.json({ data });
  },
};
