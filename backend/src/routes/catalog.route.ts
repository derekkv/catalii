import { Router } from "express";
import { requireAuth, requireBusiness, asyncHandler } from "@/middlewares/auth.js";
import { catalogController } from "@/controllers/catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.use(requireAuth, requireBusiness);

catalogRouter.get("/", asyncHandler(catalogController.list));
catalogRouter.post("/", asyncHandler(catalogController.create));
catalogRouter.patch("/:id", asyncHandler(catalogController.update));
catalogRouter.delete("/:id", asyncHandler(catalogController.remove));
