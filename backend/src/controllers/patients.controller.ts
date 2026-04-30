import { Request, Response } from "express";
import { createExternalPatient } from "../services/patients.service";
import { AuthRequest } from "../middleware/auth.middleware";

interface CreateExternalPatientBody {
  fullName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

export async function createExternalPatientHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { fullName, email, phone, dateOfBirth, gender } = req.body as CreateExternalPatientBody;
    const nurseId = req.user?.userId;

    // Validate required fields
    if (!fullName || !phone || !dateOfBirth || !gender) {
      res.status(400).json({
        status: "error",
        message: "fullName, phone, dateOfBirth, and gender are required",
      });
      return;
    }

    if (!nurseId) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    const patient = await createExternalPatient({
      fullName,
      email: email || null,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      registeredByNurseId: nurseId,
    });

    res.status(201).json({
      status: "success",
      data: {
        id: patient.id,
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        role: patient.role,
        isExternal: patient.isExternal,
      },
    });
  } catch (error) {
    console.error("Create external patient error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to register external patient",
    });
  }
}
