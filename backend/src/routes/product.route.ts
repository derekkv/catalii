import { Router } from "express";
import { requireAuth, requireBusiness, asyncHandler } from "@/middlewares/auth.js";
import { productController } from "@/controllers/product.controller.js";

export const productRouter = Router();

// Todas las rutas de productos exigen sesión + negocio.
productRouter.use(requireAuth, requireBusiness);

productRouter.get("/", asyncHandler(productController.list));
productRouter.post("/", asyncHandler(productController.create));
productRouter.get("/:id", asyncHandler(productController.get));
productRouter.patch("/:id", asyncHandler(productController.update));
productRouter.delete("/:id", asyncHandler(productController.remove));
