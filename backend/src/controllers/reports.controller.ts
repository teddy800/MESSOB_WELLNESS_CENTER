import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma';
import path from 'path';
import fs from 'fs';

const generateHealthReport = async (patientId: string | string[], nurseId: string, options: any) => {
  const pid = Array.isArray(patientId) ? patientId[0] : patientId;
  
  console.log('Fetching patient data for:', pid);
  
  const patient = await prisma.user.findUnique({
    where: { id: pid },
    include: {
      vitalsRecords: { orderBy: { recordedAt: 'desc' }, take: 1 },
      wellnessPlans: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!patient) {
    console.error('Patient not found:', pid);
    throw new Error('Patient not found');
  }

  console.log('Patient found:', patient.fullName);
  console.log('Vitals count:', (patient.vitalsRecords as any)?.length || 0);
  console.log('Wellness plans count:', (patient.wellnessPlans as any)?.length || 0);
  console.log('Options received:', options);
  
  if (patient.vitalsRecords && patient.vitalsRecords.length > 0) {
    console.log('Latest vitals data:', JSON.stringify(patient.vitalsRecords[0], null, 2));
  }
  
  if (patient.wellnessPlans && patient.wellnessPlans.length > 0) {
    console.log('Latest wellness plan:', patient.wellnessPlans[0].planText?.substring(0, 100));
  }

  const nurse = await prisma.user.findUnique({ where: { id: nurseId } });
  console.log('Nurse found:', nurse?.fullName);

  console.log('Creating PDF document...');
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true,
    autoFirstPage: true
  });

  try {
    // ===== HEADER WITH LOGO =====
    const logoPath = path.join(__dirname, '../../public/Mesob-short-png.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 60 });
    }
    
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#3550A0').text('MESOB', 120, 45);
    doc.fontSize(11).font('Helvetica').fillColor('#6B7280').text('Health & Wellness System', 120, 75);
    
    // Date on right
    doc.fontSize(10).fillColor('#6B7280').text(
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 
      400, 50, { width: 145, align: 'right' }
    );
    
    doc.moveTo(50, 105).lineTo(545, 105).lineWidth(2).stroke('#3550A0');
    
    let y = 130;

    // ===== PATIENT INFORMATION =====
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('Patient Information', 50, y);
    y += 30;
    
    // Info grid
    doc.roundedRect(50, y, 240, 60, 5).lineWidth(1).stroke('#E5E7EB');
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text('Full Name', 60, y + 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text(patient.fullName, 60, y + 28, { width: 220 });
    
    doc.roundedRect(305, y, 240, 60, 5).lineWidth(1).stroke('#E5E7EB');
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text('Email', 315, y + 10);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text(patient.email || 'N/A', 315, y + 28, { width: 220 });
    
    y += 75;
    
    doc.roundedRect(50, y, 495, 60, 5).lineWidth(1).stroke('#E5E7EB');
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text('Patient ID', 60, y + 10);
    doc.fontSize(10).font('Helvetica').fillColor('#1F2937').text(patient.id, 60, y + 28, { width: 475 });
    
    y += 85;

    // ===== VITALS SECTION =====
    if (options.includeVitals && patient.vitalsRecords && patient.vitalsRecords.length > 0) {
      const v: any = patient.vitalsRecords[0];
      
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('Latest Vital Signs', 50, y);
      y += 30;
      
      // Vitals grid - 3 columns
      const boxWidth = 157;
      const boxHeight = 70;
      const gap = 12;
      let col = 0;
      let row = 0;
      
      const addVital = (label: string, value: string, unit: string) => {
        const x = 50 + col * (boxWidth + gap);
        const boxY = y + row * (boxHeight + gap);
        
        doc.roundedRect(x, boxY, boxWidth, boxHeight, 5).fillAndStroke('#EFF6FF', '#3550A0');
        doc.fontSize(9).font('Helvetica').fillColor('#3550A0').text(label, x + 12, boxY + 12);
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#1F2937').text(value, x + 12, boxY + 30);
        doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(unit, x + 12, boxY + 55);
        
        col++;
        if (col >= 3) {
          col = 0;
          row++;
        }
      };
      
      if (v.systolic && v.diastolic) addVital('Blood Pressure', `${v.systolic}/${v.diastolic}`, 'mmHg');
      if (v.heartRate) addVital('Heart Rate', `${v.heartRate}`, 'bpm');
      if (v.temperature) addVital('Temperature', `${v.temperature}`, '°C');
      if (v.oxygenSaturation) addVital('O₂ Saturation', `${v.oxygenSaturation}`, '%');
      if (v.bmi) addVital('BMI', `${v.bmi}`, v.bmiCategory || '');
      
      y += (row + 1) * (boxHeight + gap) + 10;
      
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#6B7280')
        .text(`Recorded: ${new Date(v.recordedAt).toLocaleString()}`, 50, y);
      y += 30;
    }

    // ===== WELLNESS PLAN =====
    if (options.includeWellnessPlan && patient.wellnessPlans && patient.wellnessPlans.length > 0) {
      const plan: any = patient.wellnessPlans[0];
      
      // Check if we need a new page (only if really necessary)
      if (y > 600) {
        doc.addPage();
        y = 50;
      }
      
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('Wellness Plan', 50, y);
      y += 30;
      
      // Calculate available space
      const availableHeight = 720 - y; // Leave space for footer
      const planY = y;
      
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      const textHeight = doc.heightOfString(plan.planText, { width: 475, lineGap: 4 });
      
      // If text is too long, it will automatically flow to next page
      doc.roundedRect(50, planY, 495, Math.min(textHeight + 30, availableHeight), 5).lineWidth(1).stroke('#E5E7EB');
      doc.text(plan.planText, 60, planY + 15, { width: 475, lineGap: 4 });
      
      y += Math.min(textHeight + 45, availableHeight);
      
      // Add metadata on same page if space available, otherwise on next page
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      
      if (plan.duration) {
        doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
          .text(`Duration: ${plan.duration} days`, 50, y);
        y += 15;
      }
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#6B7280')
        .text(`Created: ${new Date(plan.createdAt).toLocaleString()}`, 50, y);
    }

    console.log('PDF document created successfully');
  } catch (pdfError: any) {
    console.error('Error creating PDF content:', pdfError);
    throw new Error(`PDF generation failed: ${pdfError.message}`);
  }

  return doc;
};

export const generateCombinedReport = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const { patientId } = req.params;
    const { includeVitals = true, includeWellnessPlan = true } = req.query;

    if (!patientId) {
      res.status(400).json({
        status: 'error',
        message: 'Patient ID is required',
      });
      return;
    }

    console.log('Generating PDF for patient:', patientId);
    console.log('Options:', { includeVitals, includeWellnessPlan });

    // Generate PDF
    const doc = await generateHealthReport(patientId, req.user.userId, {
      includeVitals: includeVitals === 'true',
      includeWellnessPlan: includeWellnessPlan === 'true',
    });

    console.log('PDF generated successfully');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="health-report-${patientId}-${Date.now()}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error: any) {
    console.error('Generate report error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate report',
      details: error.message,
    });
  }
};
