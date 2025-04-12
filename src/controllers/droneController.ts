import { Request, Response } from 'express';
import Drone from '../models/drone';
import { validateObjectId } from '../utils/validateObjectId';
import { droneSchema } from '../validators/droneValidator';

// Create a drone
export const createDrone = async (req: Request, res: Response) => {
    try {
      const parsed = droneSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.format() });
        return;
      }
  
      const drone = await Drone.create(parsed.data);
      res.status(201).json(drone);
    } catch (error) {
      console.error('Create Drone Error:', error);
      res.status(500).json({ message: 'Server error while creating drone' });
    }
  };
  
  // Update drone
  export const updateDrone = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      if (!validateObjectId(id)) {
        res.status(400).json({ message: 'Invalid drone ID' });
        return;
      }
  
      const parsed = droneSchema.partial().safeParse(req.body); // Allow partial updates
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.format() });
        return;
      }
  
      const updated = await Drone.findByIdAndUpdate(id, parsed.data, { new: true });
      if (!updated) {
        res.status(404).json({ message: 'Drone not found' });
        return;
      }
  
      res.json(updated);
    } catch (error) {
      console.error('Update Drone Error:', error);
      res.status(500).json({ message: 'Server error while updating drone' });
    }
  };

// Get all drones
export const getDrones = async (_req: Request, res: Response) => {
  try {
    const drones = await Drone.find();
    res.json(drones);
  } catch (error) {
    console.error('Get Drones Error:', error);
    res.status(500).json({ message: 'Server error while fetching drones' });
  }
};

// Get drone by ID
export const getDroneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      res.status(400).json({ message: 'Invalid drone ID' });
      return;
    }

    const drone = await Drone.findById(id);
    if (!drone) {
      res.status(404).json({ message: 'Drone not found' });
      return;
    }

    res.json(drone);
  } catch (error) {
    console.error('Get Drone By ID Error:', error);
    res.status(500).json({ message: 'Server error while fetching drone' });
  }
};


// Delete drone
export const deleteDrone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      res.status(400).json({ message: 'Invalid drone ID' });
      return;
    }

    const deleted = await Drone.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Drone not found' });
      return;
    }

    res.json({ message: 'Drone deleted successfully' });
  } catch (error) {
    console.error('Delete Drone Error:', error);
    res.status(500).json({ message: 'Server error while deleting drone' });
  }
};
