import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, nutritionTable } from "@fitness/db";
import { eq, and, desc } from "drizzle-orm";
import { LogNutritionBody, ListNutritionQueryParams, DeleteNutritionParams } from "@fitness/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/nutrition", requireAuth, async (req: any, res) => {
  try {
    const query = ListNutritionQueryParams.parse(req.query);
    let q = db
      .select()
      .from(nutritionTable)
      .where(eq(nutritionTable.userId, req.userId))
      .$dynamic();
    if (query.date) {
      q = q.where(and(eq(nutritionTable.userId, req.userId), eq(nutritionTable.date, query.date)));
    }
    const entries = await q.orderBy(desc(nutritionTable.createdAt));
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to list nutrition");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/nutrition", requireAuth, async (req: any, res) => {
  try {
    const body = LogNutritionBody.parse(req.body);
    const [entry] = await db
      .insert(nutritionTable)
      .values({ ...body, userId: req.userId })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to log nutrition");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/nutrition/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = DeleteNutritionParams.parse({ id: parseInt(req.params.id) });
    await db
      .delete(nutritionTable)
      .where(and(eq(nutritionTable.id, id), eq(nutritionTable.userId, req.userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete nutrition entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
