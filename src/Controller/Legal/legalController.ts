import { Request, Response } from 'express';
import Legal, { ILegal } from '../../Model/legal';

// GET /api/legal - Get all legal documents
export const getAllLegal = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const legalDocuments = await Legal.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Legal documents retrieved successfully',
      data: legalDocuments,
      count: legalDocuments.length,
    });
  } catch (error: any) {
    console.error('Error retrieving legal documents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// GET /api/legal/:id - Get single legal document by legalId
export const getLegalById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const legalDocument = await Legal.findOne({ legalId: id });

    if (!legalDocument) {
      res.status(404).json({
        success: false,
        message: 'Legal document not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal document retrieved successfully',
      data: legalDocument,
    });
  } catch (error: any) {
    console.error('Error retrieving legal document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// POST /api/legal - Create new legal document
export const createLegal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { legalName, legalDescription } = req.body as Partial<ILegal>;

    // Validate required fields
    if (!legalName || !legalDescription) {
      res.status(400).json({
        success: false,
        message: 'Required fields: legalName, legalDescription',
      });
      return;
    }

    const legalDocument = new Legal({
      legalName: legalName.trim(),
      legalDescription: legalDescription.trim(),
    });

    const created = await legalDocument.save();

    res.status(201).json({
      success: true,
      message: 'Legal document created successfully',
      data: created,
      legalId: created.legalId,
    });
  } catch (error: any) {
    console.error('Error creating legal document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /api/legal/:id - Update legal document
export const updateLegal = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { legalName, legalDescription } = req.body as Partial<ILegal>;

    // Validate that at least one field is provided
    if (!legalName && !legalDescription) {
      res.status(400).json({
        success: false,
        message:
          'At least one field (legalName or legalDescription) must be provided',
      });
      return;
    }

    const updateData: Partial<ILegal> = {};

    if (legalName !== undefined) {
      updateData.legalName = legalName.trim();
    }

    if (legalDescription !== undefined) {
      updateData.legalDescription = legalDescription.trim();
    }

    const updated = await Legal.findOneAndUpdate({ legalId: id }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Legal document not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal document updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating legal document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /api/legal/:id - Delete legal document
export const deleteLegal = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await Legal.findOneAndDelete({ legalId: id });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Legal document not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal document deleted successfully',
      data: deleted,
    });
  } catch (error: any) {
    console.error('Error deleting legal document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
