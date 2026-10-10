import mongoose from 'mongoose';
import Client from '../models/clientModel.js';
import Company from '../models/companyModel.js';
import { sendClientWelcomeEmail } from '../services/emailService.js';

/**
 * Helper to generate sequential unique clientId per company (CLI-001, CLI-002, etc.)
 */
const generateNextClientId = async (companyIds, adminEmail) => {
  const existingClients = await Client.find({
    companyId: { $in: companyIds },
    adminEmail
  }).select('clientId createdAt');

  let maxNum = 0;
  existingClients.forEach((c) => {
    if (c.clientId) {
      const match = c.clientId.match(/CLI-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num < 10000) {
          if (num > maxNum) maxNum = num;
        }
      }
    }
  });

  if (maxNum === 0 && existingClients.length > 0) {
    maxNum = existingClients.length;
  }

  const nextNum = maxNum + 1;
  return `CLI-${String(nextNum).padStart(3, '0')}`;
};

/**
 * @desc    Get next available sequential clientId for company
 * @route   GET /api/clients/next-id
 * @access  Private
 */
export const getNextClientId = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required.' });
    }

    let companyIds = [companyId];
    try {
      const comp = await Company.findOne({
        adminEmail,
        $or: [
          { companyId },
          { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
        ]
      });
      if (comp) {
        companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
      }
    } catch {}

    const nextId = await generateNextClientId(companyIds, adminEmail);
    return res.status(200).json({ success: true, nextId });
  } catch (error) {
    console.error('Error getting next clientId:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate next client ID.' });
  }
};

/**
 * @desc    Get all clients isolated to the active company profile
 * @route   GET /api/clients
 * @access  Private
 */
export const getClients = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch isolated clients.'
      });
    }

    let companyIds = [companyId];
    try {
      const comp = await Company.findOne({
        adminEmail,
        $or: [
          { companyId },
          { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
        ]
      });
      if (comp) {
        companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
      }
    } catch {}

    const clients = await Client.find({
      companyId: { $in: companyIds },
      adminEmail
    }).sort({ createdAt: 1 });

    // Normalize any legacy timestamp or missing clientIds to clean CLI-001, CLI-002 sequence
    let seq = 1;
    for (const c of clients) {
      const isTimestampOrLegacy = !c.clientId || (c.clientId.startsWith('CLI-') && c.clientId.length > 8);
      if (isTimestampOrLegacy) {
        c.clientId = `CLI-${String(seq).padStart(3, '0')}`;
        await c.save().catch(() => {});
      }
      seq++;
    }

    // Sort newest first for display
    clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      count: clients.length,
      clients: clients.map(c => c.toJSON())
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve clients.'
    });
  }
};

/**
 * @desc    Create a new client associated with the active company profile
 * @route   POST /api/clients
 * @access  Private (Admin)
 */
export const createClient = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Active Company ID is required to associate new client.'
      });
    }

    let companyIds = [companyId];
    try {
      const comp = await Company.findOne({
        adminEmail,
        $or: [
          { companyId },
          { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
        ]
      });
      if (comp) {
        companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
      }
    } catch {}

    const {
      clientId,
      name,
      gstin,
      contactPerson,
      contactNumber,
      contractStartDate,
      contractEndDate,
      status,
      address,
      typeOfService,
      document,
      overtimeType,
      overtimeBasis,
      compliance,
      employees
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Client Name is required.'
      });
    }

    let finalClientId = (clientId || '').trim();
    if (!finalClientId || (finalClientId.startsWith('CLI-') && finalClientId.length > 8)) {
      finalClientId = await generateNextClientId(companyIds, adminEmail);
    }

    const sanitizedDoc = (document && typeof document === 'object' && Object.keys(document).length === 0)
      ? null
      : (document || null);

    const newClient = await Client.create({
      clientId: finalClientId,
      companyId,
      adminEmail,
      name: name.trim(),
      gstin: (gstin || '').toUpperCase(),
      contactPerson: contactPerson || '',
      contactNumber: contactNumber || '',
      contractStartDate: contractStartDate || '',
      contractEndDate: contractEndDate || '',
      status: status || 'active',
      address: address || '',
      typeOfService: typeOfService || '',
      document: sanitizedDoc,
      overtimeType: overtimeType || '',
      overtimeBasis: overtimeBasis || '',
      compliance: compliance || {},
      employees: employees || 0,
      password: req.body.password ? req.body.password.trim() : undefined,
      savedPassword: req.body.password ? req.body.password.trim() : (req.body.savedPassword || ''),
      enablePortalAccess: req.body.enablePortalAccess !== undefined
        ? Boolean(req.body.enablePortalAccess === true || req.body.enablePortalAccess === 'true')
        : true
    });

    return res.status(201).json({
      success: true,
      message: `Client "${newClient.name}" (${newClient.clientId}) created and associated with company ${companyId}.`,
      client: newClient.toJSON()
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create client.'
    });
  }
};

/**
 * @desc    Get a single client by ID or clientId
 * @route   GET /api/clients/:id
 * @access  Private
 */
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const cleanId = (id || '').trim();
    const cleanNoHyphen = cleanId.replace(/[-_ ]/g, '');
    const flexibleRegex = new RegExp(`^(${cleanId}|${cleanNoHyphen}|CLI-${cleanNoHyphen.replace(/^cli/i, '')})$`, 'i');

    const orConditions = [{ clientId: { $regex: flexibleRegex } }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      orConditions.push({ _id: cleanId });
    }

    const client = await Client.findOne({
      $or: orConditions,
      adminEmail
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    return res.status(200).json({
      success: true,
      client: client.toJSON()
    });
  } catch (error) {
    console.error('Error getting client by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve client details.'
    });
  }
};

/**
 * @desc    Update a client
 * @route   PUT /api/clients/:id
 * @access  Private (Admin)
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    const cleanId = (id || '').trim();
    const cleanNoHyphen = cleanId.replace(/[-_ ]/g, '');
    const flexibleRegex = new RegExp(`^(${cleanId}|${cleanNoHyphen}|CLI-${cleanNoHyphen.replace(/^cli/i, '')})$`, 'i');

    const orConditions = [{ clientId: { $regex: flexibleRegex } }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      orConditions.push({ _id: cleanId });
    }

    const query = {
      $or: orConditions,
      adminEmail
    };

    if (companyId) {
      let companyIds = [companyId];
      try {
        const comp = await Company.findOne({
          adminEmail,
          $or: [
            { companyId },
            { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
          ]
        });
        if (comp) {
          companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
        }
      } catch {}
      query.companyId = { $in: companyIds };
    }

    let client = await Client.findOne(query);

    // Fallback if companyId mismatch but matches adminEmail
    if (!client) {
      client = await Client.findOne({
        $or: orConditions,
        adminEmail
      });
    }

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    const fields = [
      'clientId', 'name', 'email', 'gstin', 'contactPerson', 'contactNumber',
      'contractStartDate', 'contractEndDate', 'status', 'address',
      'typeOfService', 'document', 'overtimeType', 'overtimeBasis',
      'compliance', 'employees'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    if (req.body.enablePortalAccess !== undefined) {
      client.enablePortalAccess = Boolean(req.body.enablePortalAccess === true || req.body.enablePortalAccess === 'true');
    }

    if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim()) {
      const cleanPassword = req.body.password.trim();
      client.password = cleanPassword;
      client.savedPassword = cleanPassword;
    } else if (req.body.savedPassword && typeof req.body.savedPassword === 'string' && req.body.savedPassword.trim()) {
      const cleanPassword = req.body.savedPassword.trim();
      client.password = cleanPassword;
      client.savedPassword = cleanPassword;
    }

    await client.save();

    // If welcome email requested or credentials saved with sendWelcomeEmail flag
    if (req.body.sendWelcomeEmail === true || req.body.sendEmail === true) {
      const recipientEmail = (req.body.recipientEmail || client.email || '').trim();
      const rawPassword = req.body.password || client.savedPassword || '••••••';
      if (recipientEmail) {
        let activeCompName = '';
        if (companyId) {
          try {
            const compDoc = await Company.findOne({
              $or: [
                ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
                { companyId }
              ]
            }).lean();
            if (compDoc?.name) activeCompName = compDoc.name;
          } catch {}
        }

        sendClientWelcomeEmail({
          to: recipientEmail,
          clientData: client,
          password: rawPassword,
          companyName: activeCompName,
          companyId
        }).catch(err => console.warn('[ClientController] Client welcome email dispatch error:', err.message));
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Client credentials and details updated successfully.',
      client: client.toJSON()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update client.'
    });
  }
};

/**
 * @desc    Send Client Portal Welcome Email with Credentials on Demand
 * @route   POST /api/clients/:id/send-credentials
 * @access  Private (Admin)
 */
export const sendClientCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    const cleanId = (id || '').trim();
    const cleanNoHyphen = cleanId.replace(/[-_ ]/g, '');
    const flexibleRegex = new RegExp(`^(${cleanId}|${cleanNoHyphen}|CLI-${cleanNoHyphen.replace(/^cli/i, '')})$`, 'i');

    const orConditions = [{ clientId: { $regex: flexibleRegex } }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      orConditions.push({ _id: cleanId });
    }

    const query = {
      $or: orConditions,
      adminEmail
    };

    if (companyId) {
      let companyIds = [companyId];
      try {
        const comp = await Company.findOne({
          adminEmail,
          $or: [
            { companyId },
            { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
          ]
        });
        if (comp) {
          companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
        }
      } catch {}
      query.companyId = { $in: companyIds };
    }

    let client = await Client.findOne(query);
    if (!client) {
      client = await Client.findOne({ $or: orConditions, adminEmail });
    }

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const recipientEmail = (req.body.to || req.body.recipientEmail || client.email || '').trim();
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No recipient email specified and client has no email registered on profile.'
      });
    }

    const rawPassword = req.body.password || client.savedPassword || client.password || '••••••';

    let activeCompName = '';
    if (companyId) {
      try {
        const compDoc = await Company.findOne({
          $or: [
            ...(mongoose.isValidObjectId(companyId) ? [{ _id: companyId }] : []),
            { companyId }
          ]
        }).lean();
        if (compDoc?.name) activeCompName = compDoc.name;
      } catch {}
    }

    const result = await sendClientWelcomeEmail({
      to: recipientEmail,
      clientData: client,
      password: rawPassword,
      companyName: activeCompName,
      companyId
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to send email: ${result.error}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome email with login credentials successfully sent to ${recipientEmail}!`
    });
  } catch (error) {
    console.error('Error in sendClientCredentials:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send credentials email.'
    });
  }
};

/**
 * @desc    Toggle client active / inactive status
 * @route   PATCH /api/clients/:id/status
 * @access  Private (Admin)
 */
export const toggleClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const { status } = req.body;

    const orConditions = [{ clientId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const query = {
      $or: orConditions,
      adminEmail
    };

    if (companyId) {
      let companyIds = [companyId];
      try {
        const comp = await Company.findOne({
          adminEmail,
          $or: [
            { companyId },
            { _id: mongoose.Types.ObjectId.isValid(companyId) ? companyId : null }
          ]
        });
        if (comp) {
          companyIds = Array.from(new Set([comp.companyId, comp._id?.toString(), companyId])).filter(Boolean);
        }
      } catch {}
      query.companyId = { $in: companyIds };
    }

    const client = await Client.findOne(query);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    client.status = status || (client.status?.toLowerCase() === 'active' ? 'inactive' : 'active');
    await client.save();

    return res.status(200).json({
      success: true,
      message: `Client status updated to ${client.status}.`,
      client: client.toJSON()
    });
  } catch (error) {
    console.error('Error toggling client status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update client status.'
    });
  }
};

/**
 * @desc    Delete a client
 * @route   DELETE /api/clients/:id
 * @access  Private (Admin)
 */
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();

    const orConditions = [{ clientId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ _id: id });
    }

    const client = await Client.findOneAndDelete({
      $or: orConditions,
      adminEmail
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Client deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete client.'
    });
  }
};
