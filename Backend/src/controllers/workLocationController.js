import mongoose from 'mongoose';
import WorkLocation from '../models/workLocationModel.js';

/**
 * @desc    Get all work locations isolated to the active company profile
 * @route   GET /api/work-locations
 * @access  Private
 */
export const getWorkLocations = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated work locations.'
      });
    }

    const locations = await WorkLocation.find({
      companyId,
      adminEmail
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: locations.length,
      locations: locations.map(l => l.toJSON())
    });
  } catch (error) {
    console.error('Error getting work locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve work locations.'
    });
  }
};

/**
 * @desc    Create a new work location associated with the active company profile
 * @route   POST /api/work-locations
 * @access  Private (Admin)
 */
export const createWorkLocation = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Active Company ID is required to associate new work location.'
      });
    }

    const {
      locationName,
      locationType,
      address,
      city,
      state,
      pinCode,
      status
    } = req.body;

    if (!locationName || !locationName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location name is required.'
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Address is required.'
      });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'City is required.'
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required.'
      });
    }

    if (!pinCode || !pinCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'PIN code is required.'
      });
    }

    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const newLocation = await WorkLocation.create({
      locationId: `LOC-${Date.now().toString().slice(-6)}`,
      companyId,
      adminEmail,
      locationName: locationName.trim(),
      locationType: locationType || 'branch',
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      status: status || 'active',
      createdOn: todayFormatted,
      lastUpdated: todayFormatted
    });

    return res.status(201).json({
      success: true,
      message: `Work location "${newLocation.locationName}" created and associated with company ${companyId}.`,
      location: newLocation.toJSON()
    });
  } catch (error) {
    console.error('Error creating work location:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create work location.'
    });
  }
};

/**
 * @desc    Update a work location
 * @route   PUT /api/work-locations/:id
 * @access  Private (Admin)
 */
export const updateWorkLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    const orConditions = [{ locationId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const query = {
      $or: orConditions,
      adminEmail
    };
    if (companyId) query.companyId = companyId;

    const location = await WorkLocation.findOne(query);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Work location not found.'
      });
    }

    const fields = ['locationName', 'locationType', 'address', 'city', 'state', 'pinCode', 'status'];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        location[field] = req.body[field];
      }
    });

    location.lastUpdated = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    await location.save();

    return res.status(200).json({
      success: true,
      message: 'Work location updated successfully.',
      location: location.toJSON()
    });
  } catch (error) {
    console.error('Error updating work location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update work location.'
    });
  }
};

/**
 * @desc    Toggle work location active/inactive status
 * @route   PATCH /api/work-locations/:id/status
 * @access  Private (Admin)
 */
export const toggleWorkLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const { status } = req.body;

    const orConditions = [{ locationId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const query = {
      $or: orConditions,
      adminEmail
    };
    if (companyId) query.companyId = companyId;

    const location = await WorkLocation.findOne(query);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Work location not found.'
      });
    }

    location.status = status || (location.status === 'active' ? 'inactive' : 'active');
    location.lastUpdated = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    await location.save();

    return res.status(200).json({
      success: true,
      message: `Work location status updated to ${location.status}.`,
      location: location.toJSON()
    });
  } catch (error) {
    console.error('Error toggling work location status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update work location status.'
    });
  }
};

/**
 * @desc    Delete a work location
 * @route   DELETE /api/work-locations/:id
 * @access  Private (Admin)
 */
export const deleteWorkLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();

    const orConditions = [{ locationId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const location = await WorkLocation.findOneAndDelete({
      $or: orConditions,
      adminEmail
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Work location not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Work location deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting work location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete work location.'
    });
  }
};
