import { Router, type IRouter } from "express";
import { connectDB, Facility } from "@workspace/db";
import { CreateFacilityBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Get all active facilities
router.get("/facilities", async (req, res): Promise<void> => {
  try {
    await connectDB();
    const facilities = await Facility.find({ status: "active" }).select("-__v");
    
    res.json(facilities.map(f => ({
      id: f._id.toString(),
      name: f.name,
      displayName: f.displayName,
      type: f.type,
      capacity: f.capacity,
      systemCount: f.systemCount,
      seatCount: f.seatCount,
      description: f.description,
      status: f.status
    })));
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new facility (admin only)
router.post("/admin/facilities", async (req, res): Promise<void> => {
  try {
    const data = CreateFacilityBody.safeParse(req.body);
    if (!data.success) {
      res.status(400).json({ error: data.error.message });
      return;
    }

    await connectDB();
    
    // Check if name already exists
    const existing = await Facility.findOne({ name: data.data.name });
    if (existing) {
      res.status(400).json({ error: "Facility with this short name already exists" });
      return;
    }

    const facility = new Facility(data.data);
    await facility.save();

    res.status(201).json({
      id: facility._id.toString(),
      name: facility.name,
      displayName: facility.displayName,
      type: facility.type,
      capacity: facility.capacity,
      systemCount: facility.systemCount,
      seatCount: facility.seatCount,
      description: facility.description,
      status: facility.status
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a facility
router.put("/admin/facilities/:id", async (req, res): Promise<void> => {
  try {
    const data = CreateFacilityBody.safeParse(req.body);
    if (!data.success) {
      res.status(400).json({ error: data.error.message });
      return;
    }

    await connectDB();
    
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      data.data,
      { new: true }
    );

    if (!facility) {
      res.status(404).json({ error: "Facility not found" });
      return;
    }

    res.json({
      id: facility._id.toString(),
      name: facility.name,
      displayName: facility.displayName,
      type: facility.type,
      capacity: facility.capacity,
      systemCount: facility.systemCount,
      seatCount: facility.seatCount,
      description: facility.description,
      status: facility.status
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a facility
router.delete("/admin/facilities/:id", async (req, res): Promise<void> => {
  try {
    await connectDB();
    const facility = await Facility.findByIdAndDelete(req.params.id);
    
    if (!facility) {
      res.status(404).json({ error: "Facility not found" });
      return;
    }

    res.json({
      id: facility._id.toString(),
      name: facility.name,
      displayName: facility.displayName,
      type: facility.type,
      capacity: facility.capacity,
      systemCount: facility.systemCount,
      seatCount: facility.seatCount,
      description: facility.description,
      status: facility.status
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
