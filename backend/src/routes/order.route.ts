import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireBusiness, asyncHandler } from "@/middlewares/auth.js";
import { orderController } from "@/controllers/order.controller.js";

export const orderRouter = Router();

function wrap(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

// Público: enviar un pedido desde el catálogo.
orderRouter.post("/", wrap(orderController.place));

// Panel: ver pedidos y cambiar su estado (requiere sesión + negocio).
orderRouter.get("/", requireAuth, requireBusiness, asyncHandler(orderController.list));
orderRouter.patch(
  "/:id/status",
  requireAuth,
  requireBusiness,
  asyncHandler(orderController.updateStatus),
);
