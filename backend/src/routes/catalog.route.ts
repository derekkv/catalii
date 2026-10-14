import { Router } from "express";
import { requireAuth, requireBusiness, asyncHandler } from "@/middlewares/auth.js";
import { validateBody } from "@/middlewares/validate.js";
import { createCatalogSchema, updateCatalogSchema } from "@/schemas/catalog.schema.js";
import { catalogController } from "@/controllers/catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.use(requireAuth, requireBusiness);

catalogRouter.get("/", asyncHandler(catalogController.list));
catalogRouter.post("/", validateBody(createCatalogSchema), asyncHandler(catalogController.create));
catalogRouter.patch("/:id", validateBody(updateCatalogSchema), asyncHandler(catalogController.update));
catalogRouter.delete("/:id", asyncHandler(catalogController.remove));
