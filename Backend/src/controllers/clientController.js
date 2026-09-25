import Client from '../models/clientModel.js';

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

    const clients = await Client.find({
      companyId,
      adminEmail
    }).sort({ createdAt: -1 });

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

    const {
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

    const sanitizedDoc = (document && typeof document === 'object' && Object.keys(document).length === 0)
      ? null
      : (document || null);

    const newClient = await Client.create({
      clientId: `CLI-${Date.now().toString().slice(-6)}`,
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
      employees: employees || 0
    });

    return res.status(201).json({
      success: true,
      message: `Client "${newClient.name}" created and associated with company ${companyId}.`,
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
 * @desc    Update a client
 * @route   PUT /api/clients/:id
 * @access  Private (Admin)
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    const query = {
      $or: [{ _id: id }, { clientId: id }],
      adminEmail
    };
    if (companyId) query.companyId = companyId;

    const client = await Client.findOne(query);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    const fields = [
      'name', 'gstin', 'contactPerson', 'contactNumber',
      'contractStartDate', 'contractEndDate', 'status', 'address',
      'typeOfService', 'document', 'overtimeType', 'overtimeBasis',
      'compliance', 'employees'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    await client.save();

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully.',
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
 * @desc    Delete a client
 * @route   DELETE /api/clients/:id
 * @access  Private (Admin)
 */
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user.email.toLowerCase();

    const client = await Client.findOneAndDelete({
      $or: [{ _id: id }, { clientId: id }],
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
