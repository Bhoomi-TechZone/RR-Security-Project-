import mongoose from 'mongoose';
import Announcement from '../models/announcementModel.js';
import Company from '../models/companyModel.js';

/**
 * Helper to resolve company ID
 */
const resolveCompanyId = (req) => {
  return req.query.companyId || req.body?.companyId || req.headers['x-company-id'] || 'RRS8392014SEC';
};

/**
 * Helper to build safe ID filter
 */
const buildIdQuery = (id) => {
  const or = [{ announcementId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    or.push({ _id: id });
  }
  return { $or: or };
};

/**
 * @desc    Get announcements with targeted audience filtering
 * @route   GET /api/announcements
 * @access  Public / Private
 */
export const getAnnouncements = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const { role, employeeId, clientId, audience, status } = req.query;

    const andConditions = [];

    // Company isolation condition (matches companyId or default)
    if (companyId) {
      andConditions.push({
        $or: [
          { companyId: companyId },
          { companyId: { $regex: new RegExp(`^${companyId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { companyId: { $exists: false } }
        ]
      });
    }

    // Role-based filtering
    if (role === 'employee' || employeeId) {
      andConditions.push({ status: 'published' });
      andConditions.push({
        $or: [
          { audience: 'all' },
          {
            audience: 'employees',
            $or: [
              { employeeId: null },
              { employeeId: '' },
              { employeeId: employeeId }
            ]
          }
        ]
      });
    } else if (role === 'client' || clientId) {
      andConditions.push({ status: 'published' });
      andConditions.push({
        $or: [
          { audience: 'all' },
          {
            audience: 'clients',
            $or: [
              { targetClientId: null },
              { targetClientId: '' },
              { targetClientId: clientId },
              { companyIdTarget: clientId },
              { companyName: clientId },
              { targetClientName: clientId }
            ]
          }
        ]
      });
    } else {
      // Admin / User filters
      if (audience && audience !== 'all') {
        andConditions.push({ audience });
      }
      if (status && status !== 'all') {
        andConditions.push({ status });
      }
    }

    const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};
    const announcements = await Announcement.find(finalQuery).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements.',
      error: error.message
    });
  }
};

/**
 * @desc    Post a new announcement
 * @route   POST /api/announcements
 * @access  Private (Admin / Manager)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const {
      title,
      message,
      audience = 'all',
      companyIdTarget,
      companyName,
      targetClientId,
      targetClientName,
      employeeId,
      employeeName,
      targetDepartment,
      priority = 'normal',
      status = 'published',
      createdBy = 'Admin'
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title and message are required.'
      });
    }

    const announcementId = `ANN-${Date.now()}`;

    const newAnnouncement = await Announcement.create({
      announcementId,
      companyId,
      title: title.trim(),
      message: message.trim(),
      audience,
      companyIdTarget: audience === 'clients' ? (companyIdTarget || targetClientId || null) : null,
      companyName: audience === 'clients' ? (companyName || targetClientName || null) : null,
      targetClientId: audience === 'clients' ? (targetClientId || companyIdTarget || null) : null,
      targetClientName: audience === 'clients' ? (targetClientName || companyName || null) : null,
      employeeId: audience === 'employees' ? (employeeId || null) : null,
      employeeName: audience === 'employees' ? (employeeName || null) : null,
      targetDepartment: targetDepartment || null,
      priority,
      status,
      createdBy,
      createdDate: new Date().toISOString().slice(0, 10)
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully.',
      data: newAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post announcement.',
      error: error.message
    });
  }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin / Manager)
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Announcement.findOneAndUpdate(
      buildIdQuery(id),
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update announcement.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin / Manager)
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Announcement.findOneAndDelete(buildIdQuery(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement.',
      error: error.message
    });
  }
};
