import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@fitness/db";
import { eq } from "drizzle-orm";
import { CreateProfileBody, UpdateProfileBody } from "@fitness/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/profile", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkUserId, req.userId))
      .limit(1);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profile", requireAuth, async (req: any, res) => {
  try {
    const body = CreateProfileBody.parse(req.body);
    const [profile] = await db
      .insert(profilesTable)
      .values({ ...body, clerkUserId: req.userId })
      .returning();
    res.status(201).json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to create profile");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.patch("/profile", requireAuth, async (req: any, res) => {
  try {
    const body = UpdateProfileBody.parse(req.body);
    const [profile] = await db
      .update(profilesTable)
      .set(body)
      .where(eq(profilesTable.clerkUserId, req.userId))
      .returning();
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
