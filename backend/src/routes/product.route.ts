import { Router } from "express";
import { requireAuth, requireBusiness, asyncHandler } from "@/middlewares/auth.js";
import { validateBody } from "@/middlewares/validate.js";
import { createProductSchema, updateProductSchema } from "@/schemas/product.schema.js";
import { productController } from "@/controllers/product.controller.js";

export const productRouter = Router();

// Todas las rutas de productos exigen sesión + negocio.
productRouter.use(requireAuth, requireBusiness);

productRouter.get("/", asyncHandler(productController.list));
productRouter.post("/", validateBody(createProductSchema), asyncHandler(productController.create));
productRouter.get("/:id", asyncHandler(productController.get));
productRouter.patch("/:id", validateBody(updateProductSchema), asyncHandler(productController.update));
productRouter.delete("/:id", asyncHandler(productController.remove));
