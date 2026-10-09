import mongoose from 'mongoose';
import InventoryItem from '../models/inventoryItemModel.js';
import InventoryIssued from '../models/inventoryIssuedModel.js';
import InventoryReturn from '../models/inventoryReturnModel.js';
import InventoryMovement from '../models/inventoryMovementModel.js';
import InventoryClearance from '../models/inventoryClearanceModel.js';
import InventoryRequest from '../models/inventoryRequestModel.js';
import { createSystemNotification } from './notificationController.js';

/**
 * ============================================================================
 * 1. INVENTORY ITEM MASTERS (UNIFORMS & ASSETS)
 * ============================================================================
 */

/**
 * @desc    Get inventory items with filters (strictly database-driven)
 * @route   GET /api/inventory/items
 */
export const getInventoryItems = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required to fetch inventory.'
      });
    }

    const filter = { companyId, recordType: 'item' };

    if (req.query.itemType) {
      filter.itemType = req.query.itemType;
    }
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { itemName: { $regex: q, $options: 'i' } },
        { itemCode: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { vendorName: { $regex: q, $options: 'i' } }
      ];
    }

    const items = await InventoryItem.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      items: items.map((i) => i.toJSON())
    });
  } catch (error) {
    console.error('Error in getInventoryItems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory items.',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new inventory item (Uniform / Asset)
 * @route   POST /api/inventory/items
 */
export const createInventoryItem = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const {
      itemCode,
      vendorName,
      vendor,
      itemName,
      itemType,
      category,
      size,
      color,
      unit,
      brand,
      purchaseDate,
      billNumber,
      billPhoto,
      billPhotoName,
      openingStock,
      minimumStock,
      purchaseRate,
      warrantyStartDate,
      warrantyEndDate,
      clientName,
      location,
      status,
      description
    } = req.body;

    const resolvedVendor = (vendorName || vendor || '').trim();
    const resolvedItemCode = (itemCode || resolvedVendor || `UNI-${Date.now().toString().slice(-6)}`).trim().toUpperCase();

    if (!itemName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Item Name and Category are required.'
      });
    }

    const itemId = `ITM-2026-${Math.floor(100 + Math.random() * 900)}`;
    const parsedOpening = Number(openingStock || 0);

    const newItem = await InventoryItem.create({
      recordType: 'item',
      companyId,
      adminEmail,
      itemId,
      itemCode: resolvedItemCode,
      vendorName: resolvedVendor,
      vendor: resolvedVendor,
      itemName: itemName.trim(),
      itemType: itemType || (category === 'Uniform' || category === 'Accessory' ? 'uniform' : 'asset'),
      category: category.trim(),
      size: size || 'Free Size',
      color: color || 'Standard / N/A',
      unit: unit || 'Pcs',
      brand: brand || '',
      purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      billNumber: billNumber || '',
      billPhoto: billPhoto || null,
      billPhotoName: billPhotoName || '',
      openingStock: parsedOpening,
      availableQuantity: parsedOpening,
      issuedQuantity: 0,
      returnedQuantity: 0,
      damagedQuantity: 0,
      lostQuantity: 0,
      minimumStock: Number(minimumStock || 10),
      purchaseRate: Number(purchaseRate || 0),
      warrantyStartDate: warrantyStartDate || '',
      warrantyEndDate: warrantyEndDate || '',
      clientName: clientName || 'Central Stock',
      location: location || 'Central Warehouse',
      status: status || 'Active',
      description: description || ''
    });

    // Log Opening Stock Movement safely
    if (parsedOpening > 0) {
      try {
        await InventoryMovement.create({
          recordType: 'movement',
          companyId,
          adminEmail,
          movementId: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: purchaseDate || new Date().toISOString().slice(0, 10),
          itemId: newItem.itemId,
          itemCode: newItem.itemCode,
          itemName: newItem.itemName,
          movementType: 'Opening Stock',
          quantityChange: parsedOpening,
          balanceBefore: 0,
          balanceAfter: parsedOpening,
          location: newItem.location,
          reference: 'MASTER-INIT',
          performedBy: req.user.name || 'Store Admin'
        });
      } catch (mvErr) {
        console.warn('Notice: Non-critical movement log warning:', mvErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Inventory item "${newItem.itemName}" created successfully.`,
      item: newItem.toJSON()
    });
  } catch (error) {
    console.error('Error in createInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create inventory item.',
      error: error.message
    });
  }
};

/**
 * @desc    Update an inventory item
 * @route   PUT /api/inventory/items/:id
 */
export const updateInventoryItem = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.query.companyId;
    const { id } = req.params;

    const query = {
      adminEmail,
      recordType: 'item',
      $or: [{ itemId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    let item = await InventoryItem.findOne(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found.'
      });
    }

    const {
      itemCode,
      vendorName,
      vendor,
      itemName,
      itemType,
      category,
      size,
      color,
      unit,
      brand,
      purchaseDate,
      billNumber,
      billPhoto,
      billPhotoName,
      quantity,
      openingStock,
      availableQuantity,
      minimumStock,
      purchaseRate,
      warrantyStartDate,
      warrantyEndDate,
      clientName,
      location,
      status,
      description
    } = req.body;

    if (vendorName !== undefined || vendor !== undefined) {
      const v = (vendorName !== undefined ? vendorName : vendor || '').trim();
      item.vendorName = v;
      item.vendor = v;
    }

    if (itemCode) {
      const codeUpper = itemCode.trim().toUpperCase();
      if (codeUpper !== item.itemCode) {
        const existingCode = await InventoryItem.findOne({
          companyId,
          adminEmail,
          recordType: 'item',
          itemCode: codeUpper,
          _id: { $ne: item._id }
        });
        if (existingCode) {
          return res.status(400).json({
            success: false,
            message: `Item code / Identity number "${codeUpper}" already exists on another item.`
          });
        }
        item.itemCode = codeUpper;
      }
    }

    if (itemName) item.itemName = itemName.trim();
    if (itemType) item.itemType = itemType;
    if (category) item.category = category.trim();
    if (size !== undefined) item.size = size;
    if (color !== undefined) item.color = color;
    if (unit !== undefined) item.unit = unit;
    if (brand !== undefined) item.brand = brand;
    if (purchaseDate !== undefined) item.purchaseDate = purchaseDate;
    if (billNumber !== undefined) item.billNumber = billNumber;
    if (billPhoto !== undefined) item.billPhoto = billPhoto;
    if (billPhotoName !== undefined) item.billPhotoName = billPhotoName;

    // Handle Quantity / Opening Stock update seamlessly
    const parsedQty = quantity !== undefined ? Number(quantity) : (openingStock !== undefined ? Number(openingStock) : undefined);
    if (parsedQty !== undefined && !isNaN(parsedQty)) {
      item.openingStock = parsedQty;
      const currentlyIssued = Number(item.issuedQuantity || 0);
      const currentlyReturned = Number(item.returnedQuantity || 0);
      item.availableQuantity = Math.max(0, parsedQty - currentlyIssued + currentlyReturned);
    } else if (availableQuantity !== undefined) {
      item.availableQuantity = Number(availableQuantity);
    }

    if (minimumStock !== undefined) item.minimumStock = Number(minimumStock);
    if (purchaseRate !== undefined) item.purchaseRate = Number(purchaseRate);
    if (warrantyStartDate !== undefined) item.warrantyStartDate = warrantyStartDate;
    if (warrantyEndDate !== undefined) item.warrantyEndDate = warrantyEndDate;
    if (clientName !== undefined) item.clientName = clientName;
    if (location !== undefined) item.location = location;
    if (status !== undefined) item.status = status;
    if (description !== undefined) item.description = description;

    await item.save();

    return res.status(200).json({
      success: true,
      message: `Inventory item "${item.itemName}" updated successfully.`,
      item: item.toJSON()
    });
  } catch (error) {
    console.error('Error in updateInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory item.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete an inventory item
 * @route   DELETE /api/inventory/items/:id
 */
export const deleteInventoryItem = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const { id } = req.params;

    const query = {
      adminEmail,
      recordType: 'item',
      $or: [{ itemId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const item = await InventoryItem.findOneAndDelete(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Inventory item "${item.itemName}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error in deleteInventoryItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item.',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle item status (Active / Inactive)
 * @route   PATCH /api/inventory/items/:id/status
 */
export const toggleItemStatus = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const { id } = req.params;

    const query = {
      adminEmail,
      recordType: 'item',
      $or: [{ itemId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const item = await InventoryItem.findOne(query);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found.'
      });
    }

    item.status = item.status === 'Inactive' ? 'Active' : 'Inactive';
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Item status updated to ${item.status}.`,
      item: item.toJSON()
    });
  } catch (error) {
    console.error('Error in toggleItemStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle status.',
      error: error.message
    });
  }
};

/**
 * ============================================================================
 * 2. ISSUED INVENTORY (UNIFORM & ASSET ISSUANCE)
 * ============================================================================
 */

/**
 * @desc    Get issued items list
 * @route   GET /api/inventory/issued
 */
export const getIssuedItems = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const filter = { companyId, recordType: 'issued' };

    const isEmployeeRole = req.user && (req.user.role === 'employee' || req.user.role === 'guard');
    const targetEmployeeId = req.query.employeeId || (isEmployeeRole ? (req.user.employeeId || req.user.employeeCode || req.user.id || req.user._id) : null);
    const targetEmployeeName = req.query.employeeName || (isEmployeeRole ? (req.user.name || req.user.fullName) : null);
    const targetEmployeeEmail = req.query.employeeEmail || (isEmployeeRole ? req.user.email?.toLowerCase() : null);

    if (targetEmployeeId || targetEmployeeName || targetEmployeeEmail) {
      const empOr = [];
      if (targetEmployeeId) {
        empOr.push({ employeeId: targetEmployeeId });
        empOr.push({ employeeId: { $regex: new RegExp(`^${targetEmployeeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        empOr.push({ employeeCode: targetEmployeeId });
        empOr.push({ employeeCode: { $regex: new RegExp(`^${targetEmployeeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }
      if (targetEmployeeName) {
        empOr.push({ employeeName: { $regex: new RegExp(`^${targetEmployeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }
      if (targetEmployeeEmail) {
        empOr.push({ employeeEmail: targetEmployeeEmail.toLowerCase() });
      }
      if (empOr.length > 0) {
        filter.$and = [{ $or: empOr }];
      }
    }

    if (req.query.issueType) filter.issueType = req.query.issueType;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    if (req.query.search) {
      const q = req.query.search.trim();
      const searchOr = [
        { employeeName: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } },
        { itemName: { $regex: q, $options: 'i' } },
        { itemCode: { $regex: q, $options: 'i' } },
        { clientName: { $regex: q, $options: 'i' } },
        { issueId: { $regex: q, $options: 'i' } }
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    const issued = await InventoryIssued.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: issued.length,
      issued: issued.map((i) => i.toJSON())
    });
  } catch (error) {
    console.error('Error in getIssuedItems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve issued items.',
      error: error.message
    });
  }
};

/**
 * @desc    Issue uniform/asset items to an employee (multi-item support)
 * @route   POST /api/inventory/issued
 */
export const createIssuedItems = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const itemsPayload = Array.isArray(req.body.items) ? req.body.items : (Array.isArray(req.body) ? req.body : [req.body]);

    if (!itemsPayload.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required for issuance.'
      });
    }

    const savedRecords = [];

    for (const itemData of itemsPayload) {
      const {
        issueDate,
        expectedReturnDate,
        issueType,
        employeeId,
        employeeName,
        initials,
        clientId,
        clientName,
        site,
        department,
        designation,
        itemId,
        itemCode,
        itemName,
        category,
        brand,
        size,
        color,
        unit,
        quantity,
        rate,
        issueRate,
        condition,
        deductionMethod,
        adjustmentMonth,
        numberOfMonths,
        emiAmount,
        firstDeductionMonth,
        depositDeduction,
        issuedBy,
        remarks
      } = itemData;

      const qty = Number(quantity || 1);
      const rowRate = Number(rate || issueRate || 0);
      const totalAmount = Number((qty * rowRate).toFixed(2));

      // Find stock item and decrement availableQuantity, increment issuedQuantity
      const stockItem = await InventoryItem.findOne({
        companyId,
        adminEmail,
        recordType: 'item',
        $or: [
          { itemId },
          { itemCode },
          { _id: mongoose.Types.ObjectId.isValid(itemId) ? itemId : null }
        ]
      });

      const balanceBefore = stockItem ? stockItem.availableQuantity : 0;
      const balanceAfter = stockItem ? Math.max(0, balanceBefore - qty) : 0;

      if (stockItem) {
        stockItem.availableQuantity = balanceAfter;
        stockItem.issuedQuantity = (stockItem.issuedQuantity || 0) + qty;
        await stockItem.save();
      }

      const issueId = itemData.id || itemData.issueId || `ISS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newIssued = await InventoryIssued.create({
        recordType: 'issued',
        companyId,
        adminEmail,
        issueId,
        issueDate: issueDate || new Date().toISOString().slice(0, 10),
        expectedReturnDate: expectedReturnDate || null,
        issueType: issueType || (category === 'Uniform' || category === 'Accessory' ? 'uniform' : 'asset'),
        employeeId,
        employeeName,
        initials: initials || (employeeName || 'EM').slice(0, 2).toUpperCase(),
        clientId: clientId || '',
        clientName: clientName || '',
        site: site || '',
        department: department || 'Security',
        designation: designation || 'Security Guard',
        itemId: stockItem ? stockItem.itemId : itemId,
        itemCode: stockItem ? stockItem.itemCode : itemCode,
        itemName: stockItem ? stockItem.itemName : itemName,
        category: category || stockItem?.category || 'Uniform',
        brand: brand || stockItem?.brand || '',
        size: size || stockItem?.size || 'Free Size',
        color: color || stockItem?.color || 'Standard',
        unit: unit || stockItem?.unit || 'Pcs',
        quantity: qty,
        rate: rowRate,
        issueRate: rowRate,
        totalAmount,
        returnedQuantity: 0,
        pendingQuantity: qty,
        condition: condition || 'New',
        deductionMethod: deductionMethod || 'salary-adjustment',
        adjustmentMonth: adjustmentMonth || null,
        numberOfMonths: numberOfMonths || 1,
        emiAmount: emiAmount || 0,
        firstDeductionMonth: firstDeductionMonth || null,
        depositDeduction: depositDeduction || 0,
        issuedBy: issuedBy || req.user.name || 'Store Admin',
        status: 'Issued',
        remarks: remarks || ''
      });

      savedRecords.push(newIssued.toJSON());

      // Log Stock Movement safely
      try {
        await InventoryMovement.create({
          recordType: 'movement',
          companyId,
          adminEmail,
          movementId: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: issueDate || new Date().toISOString().slice(0, 10),
          itemId: stockItem ? stockItem.itemId : itemId,
          itemCode: stockItem ? stockItem.itemCode : itemCode,
          itemName: stockItem ? stockItem.itemName : itemName,
          movementType: 'Issue OUT',
          quantityChange: -qty,
          balanceBefore,
          balanceAfter,
          employeeId,
          employeeName,
          site,
          reference: issueId,
          performedBy: issuedBy || req.user.name || 'Store Admin'
        });
      } catch (mvErr) {
        console.warn('Notice: Non-critical movement log warning:', mvErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully issued ${savedRecords.length} item(s).`,
      issued: savedRecords
    });
  } catch (error) {
    console.error('Error in createIssuedItems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to issue inventory items.',
      error: error.message
    });
  }
};

/**
 * @desc    Update an issued item record
 * @route   PUT /api/inventory/issued/:id
 */
export const updateIssuedItem = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.query.companyId;
    const { id } = req.params;

    const query = {
      adminEmail,
      recordType: 'issued',
      $or: [{ issueId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const issuedRecord = await InventoryIssued.findOne(query);

    if (!issuedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Issued item record not found.'
      });
    }

    const oldQty = Number(issuedRecord.quantity || 0);
    const newQty = req.body.quantity !== undefined ? Number(req.body.quantity) : oldQty;
    const diff = newQty - oldQty;

    // If quantity changed, adjust stock
    if (diff !== 0) {
      const stockItem = await InventoryItem.findOne({
        companyId: issuedRecord.companyId,
        adminEmail,
        recordType: 'item',
        $or: [
          { itemId: issuedRecord.itemId },
          { itemCode: issuedRecord.itemCode },
          { _id: mongoose.Types.ObjectId.isValid(issuedRecord.itemId) ? issuedRecord.itemId : null }
        ]
      });

      if (stockItem) {
        const balanceBefore = stockItem.availableQuantity;
        const balanceAfter = Math.max(0, balanceBefore - diff);
        stockItem.availableQuantity = balanceAfter;
        stockItem.issuedQuantity = Math.max(0, (stockItem.issuedQuantity || 0) + diff);
        await stockItem.save();

        try {
          await InventoryMovement.create({
            recordType: 'movement',
            companyId: issuedRecord.companyId,
            adminEmail,
            movementId: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            date: req.body.issueDate || new Date().toISOString().slice(0, 10),
            itemId: stockItem.itemId,
            itemCode: stockItem.itemCode,
            itemName: stockItem.itemName,
            movementType: 'Issue Modification',
            quantityChange: -diff,
            balanceBefore,
            balanceAfter,
            employeeId: issuedRecord.employeeId,
            employeeName: issuedRecord.employeeName,
            reference: issuedRecord.issueId,
            performedBy: req.user.name || 'Store Admin'
          });
        } catch (mvErr) {
          console.warn('Notice: Non-critical movement log warning:', mvErr.message);
        }
      }
    }

    Object.assign(issuedRecord, req.body);
    issuedRecord.quantity = newQty;
    issuedRecord.pendingQuantity = Math.max(0, newQty - (issuedRecord.returnedQuantity || 0));
    issuedRecord.totalAmount = Number((newQty * (issuedRecord.rate || issuedRecord.issueRate || 0)).toFixed(2));

    await issuedRecord.save();

    return res.status(200).json({
      success: true,
      message: `Issue record "${issuedRecord.issueId}" updated successfully.`,
      issued: issuedRecord.toJSON()
    });
  } catch (error) {
    console.error('Error in updateIssuedItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update issued record.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete an issued record and restore unreturned quantity to stock
 * @route   DELETE /api/inventory/issued/:id
 */
export const deleteIssuedItem = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const { id } = req.params;

    const query = {
      adminEmail,
      recordType: 'issued',
      $or: [{ issueId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const issuedRecord = await InventoryIssued.findOneAndDelete(query);

    if (!issuedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Issued item record not found.'
      });
    }

    const unreturnedQty = Number(issuedRecord.quantity || 0) - Number(issuedRecord.returnedQuantity || 0);

    // Restore stock
    const stockItem = await InventoryItem.findOne({
      companyId: issuedRecord.companyId,
      adminEmail,
      recordType: 'item',
      $or: [
        { itemId: issuedRecord.itemId },
        { itemCode: issuedRecord.itemCode },
        { _id: mongoose.Types.ObjectId.isValid(issuedRecord.itemId) ? issuedRecord.itemId : null }
      ]
    });

    if (stockItem && unreturnedQty > 0) {
      const balanceBefore = stockItem.availableQuantity;
      const balanceAfter = balanceBefore + unreturnedQty;
      stockItem.availableQuantity = balanceAfter;
      stockItem.issuedQuantity = Math.max(0, (stockItem.issuedQuantity || 0) - Number(issuedRecord.quantity || 0));
      await stockItem.save();

      try {
        await InventoryMovement.create({
          recordType: 'movement',
          companyId: issuedRecord.companyId,
          adminEmail,
          movementId: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().slice(0, 10),
          itemId: stockItem.itemId,
          itemCode: stockItem.itemCode,
          itemName: stockItem.itemName,
          movementType: 'Issue Deleted / Cancelled',
          quantityChange: +unreturnedQty,
          balanceBefore,
          balanceAfter,
          employeeId: issuedRecord.employeeId,
          employeeName: issuedRecord.employeeName,
          reference: issuedRecord.issueId,
          performedBy: req.user.name || 'Store Admin'
        });
      } catch (mvErr) {
        console.warn('Notice: Non-critical movement log warning:', mvErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Issue record "${issuedRecord.issueId}" deleted. Restored ${unreturnedQty} unit(s) back to stock.`
    });
  } catch (error) {
    console.error('Error in deleteIssuedItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete issued item.',
      error: error.message
    });
  }
};

/**
 * ============================================================================
 * 3. RETURNS & INSPECTION LOGS
 * ============================================================================
 */

/**
 * @desc    Get return history records
 * @route   GET /api/inventory/returns
 */
export const getReturnRecords = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const filter = { companyId, recordType: 'return' };

    const isEmployeeRole = req.user && (req.user.role === 'employee' || req.user.role === 'guard');
    const targetEmployeeId = req.query.employeeId || (isEmployeeRole ? (req.user.employeeId || req.user.employeeCode || req.user.id || req.user._id) : null);
    const targetEmployeeName = req.query.employeeName || (isEmployeeRole ? (req.user.name || req.user.fullName) : null);

    if (targetEmployeeId || targetEmployeeName) {
      const empOr = [];
      if (targetEmployeeId) {
        empOr.push({ employeeId: targetEmployeeId });
        empOr.push({ employeeId: { $regex: new RegExp(`^${targetEmployeeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        empOr.push({ employeeCode: targetEmployeeId });
      }
      if (targetEmployeeName) {
        empOr.push({ employeeName: { $regex: new RegExp(`^${targetEmployeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }
      if (empOr.length > 0) {
        filter.$and = [{ $or: empOr }];
      }
    }

    if (req.query.condition && req.query.condition !== 'all') filter.condition = req.query.condition;

    if (req.query.search) {
      const q = req.query.search.trim();
      const searchOr = [
        { employeeName: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } },
        { itemName: { $regex: q, $options: 'i' } },
        { itemCode: { $regex: q, $options: 'i' } },
        { returnId: { $regex: q, $options: 'i' } }
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    const returns = await InventoryReturn.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: returns.length,
      returns: returns.map((r) => r.toJSON())
    });
  } catch (error) {
    console.error('Error in getReturnRecords:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve return records.',
      error: error.message
    });
  }
};

/**
 * @desc    Process a Return In (updates issued record, stock counts, and logs movement)
 * @route   POST /api/inventory/returns
 */
export const createReturnRecord = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const {
      issueId,
      employeeId,
      employeeName,
      initials,
      clientId,
      clientName,
      site,
      itemId,
      itemCode,
      itemName,
      category,
      size,
      returnedQuantity,
      condition,
      returnDate,
      returnValue,
      totalReturnValue,
      recoveryCharge,
      returnedBy,
      receivedBy,
      remarks
    } = req.body;

    const qty = Number(returnedQuantity || 1);

    // 1. Update the issued record
    const issuedRecord = await InventoryIssued.findOne({
      companyId,
      adminEmail,
      recordType: 'issued',
      $or: [{ issueId }, { _id: mongoose.Types.ObjectId.isValid(issueId) ? issueId : null }]
    });

    if (issuedRecord) {
      const newReturnedQty = (issuedRecord.returnedQuantity || 0) + qty;
      const newPending = Math.max(0, (issuedRecord.quantity || 0) - newReturnedQty);
      let newStatus = 'Issued';
      if (condition === 'Damaged') newStatus = 'Damaged';
      else if (condition === 'Lost') newStatus = 'Lost';
      else if (newPending === 0) newStatus = 'Returned';
      else newStatus = 'Partially Returned';

      issuedRecord.returnedQuantity = newReturnedQty;
      issuedRecord.pendingQuantity = newPending;
      issuedRecord.status = newStatus;
      await issuedRecord.save();
    }

    // 2. Update stock item
    const stockItem = await InventoryItem.findOne({
      companyId,
      adminEmail,
      recordType: 'item',
      $or: [
        { itemId },
        { itemCode },
        { _id: mongoose.Types.ObjectId.isValid(itemId) ? itemId : null }
      ]
    });

    let balanceBefore = stockItem ? stockItem.availableQuantity : 0;
    let balanceAfter = balanceBefore;

    if (stockItem) {
      if (condition === 'Good' || condition === 'New') {
        balanceAfter = balanceBefore + qty;
        stockItem.availableQuantity = balanceAfter;
        stockItem.returnedQuantity = (stockItem.returnedQuantity || 0) + qty;
      } else if (condition === 'Damaged') {
        stockItem.damagedQuantity = (stockItem.damagedQuantity || 0) + qty;
      } else if (condition === 'Lost') {
        stockItem.lostQuantity = (stockItem.lostQuantity || 0) + qty;
      }
      await stockItem.save();
    }

    // 3. Save return record
    const returnId = req.body.id || req.body.returnId || `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReturn = await InventoryReturn.create({
      recordType: 'return',
      companyId,
      adminEmail,
      returnId,
      issueId: issuedRecord ? issuedRecord.issueId : issueId,
      employeeId: employeeId || issuedRecord?.employeeId,
      employeeName: employeeName || issuedRecord?.employeeName,
      initials: initials || (employeeName || issuedRecord?.employeeName || 'EM').slice(0, 2).toUpperCase(),
      clientId: clientId || issuedRecord?.clientId || '',
      clientName: clientName || issuedRecord?.clientName || '',
      site: site || issuedRecord?.site || '',
      itemId: stockItem ? stockItem.itemId : itemId,
      itemCode: stockItem ? stockItem.itemCode : itemCode,
      itemName: stockItem ? stockItem.itemName : itemName,
      category: category || stockItem?.category || 'Uniform',
      size: size || stockItem?.size || 'Free Size',
      returnedQuantity: qty,
      condition: condition || 'Good',
      returnDate: returnDate || new Date().toISOString().slice(0, 10),
      returnValue: Number(returnValue || 0),
      totalReturnValue: Number(totalReturnValue || 0),
      recoveryCharge: Number(recoveryCharge || 0),
      returnedBy: returnedBy || req.user.name || 'Store Admin',
      receivedBy: receivedBy || returnedBy || 'Store Admin',
      remarks: remarks || `Returned in ${condition} condition.`
    });

    // 4. Log Movement safely
    const movementType = condition === 'Damaged' ? 'Damaged' : condition === 'Lost' ? 'Lost' : 'Return IN';
    try {
      await InventoryMovement.create({
        recordType: 'movement',
        companyId,
        adminEmail,
        movementId: `MOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: returnDate || new Date().toISOString().slice(0, 10),
        itemId: stockItem ? stockItem.itemId : itemId,
        itemCode: stockItem ? stockItem.itemCode : itemCode,
        itemName: stockItem ? stockItem.itemName : itemName,
        movementType,
        quantityChange: condition === 'Good' || condition === 'New' ? +qty : 0,
        balanceBefore,
        balanceAfter,
        employeeId: employeeId || issuedRecord?.employeeId,
        employeeName: employeeName || issuedRecord?.employeeName,
        reference: returnId,
        performedBy: returnedBy || req.user.name || 'Store Admin'
      });
    } catch (mvErr) {
      console.warn('Notice: Non-critical movement log warning:', mvErr.message);
    }

    return res.status(201).json({
      success: true,
      message: condition === 'Good' || condition === 'New'
        ? `✓ Return received: +${qty} units added back to available stock.`
        : `✓ Return recorded under ${condition} status.`,
      returnRecord: newReturn.toJSON()
    });
  } catch (error) {
    console.error('Error in createReturnRecord:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process return.',
      error: error.message
    });
  }
};

/**
 * ============================================================================
 * 4. STOCK MOVEMENTS & AUDIT LEDGER
 * ============================================================================
 */

/**
 * @desc    Get chronological stock movement history
 * @route   GET /api/inventory/movements
 */
export const getStockMovements = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const filter = { companyId, recordType: 'movement' };

    if (req.query.itemId) filter.itemId = req.query.itemId;
    if (req.query.movementType && req.query.movementType !== 'all') {
      filter.movementType = req.query.movementType;
    }

    const movements = await InventoryMovement.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: movements.length,
      movements: movements.map((m) => m.toJSON())
    });
  } catch (error) {
    console.error('Error in getStockMovements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stock movements.',
      error: error.message
    });
  }
};

/**
 * ============================================================================
 * 5. EMPLOYEE EXIT ASSET CLEARANCES
 * ============================================================================
 */

/**
 * @desc    Get exit clearance records
 * @route   GET /api/inventory/clearances
 */
export const getClearanceRecords = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const filter = { companyId, recordType: 'clearance' };
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;
    if (req.query.clearanceStatus && req.query.clearanceStatus !== 'all') {
      filter.clearanceStatus = req.query.clearanceStatus;
    }

    const clearances = await InventoryClearance.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: clearances.length,
      clearances: clearances.map((c) => c.toJSON())
    });
  } catch (error) {
    console.error('Error in getClearanceRecords:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve clearance records.',
      error: error.message
    });
  }
};

/**
 * @desc    Approve / sign off exit clearance certificate
 * @route   POST /api/inventory/clearances/:id/approve
 */
export const approveClearance = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId || req.query.companyId;
    const { id } = req.params;

    const query = {
      adminEmail,
      recordType: 'clearance',
      $or: [{ clearanceId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const clearance = await InventoryClearance.findOne(query);

    if (!clearance) {
      return res.status(404).json({
        success: false,
        message: 'Clearance record not found.'
      });
    }

    clearance.clearanceStatus = 'Fully Cleared';
    clearance.clearedDate = req.body.clearedDate || new Date().toISOString().slice(0, 10);
    clearance.clearedBy = req.body.clearedBy || req.user.name || 'Store Admin';
    clearance.certificateNo = req.body.certificateNo || clearance.certificateNo || `NDC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    clearance.remarks = req.body.remarks || clearance.remarks || 'All assets verified and cleared for exit settlement.';

    await clearance.save();

    return res.status(200).json({
      success: true,
      message: `Exit clearance signed off for ${clearance.employeeName}. Certificate: ${clearance.certificateNo}`,
      clearance: clearance.toJSON()
    });
  } catch (error) {
    console.error('Error in approveClearance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve exit clearance.',
      error: error.message
    });
  }
};

/**
 * ============================================================================
 * 6. EMPLOYEE UNIFORM & ASSET REQUESTS / REQUISITIONS
 * ============================================================================
 */

/**
 * @desc    Get asset / uniform requests with filters
 * @route   GET /api/inventory/requests
 */
export const getInventoryRequests = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const filter = { companyId, recordType: 'request' };

    const isEmployeeRole = req.user && (req.user.role === 'employee' || req.user.role === 'guard');
    const targetEmployeeId = req.query.employeeId || (isEmployeeRole ? (req.user.employeeId || req.user.employeeCode || req.user.id || req.user._id) : null);
    const targetEmployeeName = req.query.employeeName || (isEmployeeRole ? (req.user.name || req.user.fullName) : null);

    if (targetEmployeeId || targetEmployeeName) {
      const empOr = [];
      if (targetEmployeeId) {
        empOr.push({ employeeId: targetEmployeeId });
        empOr.push({ employeeId: { $regex: new RegExp(`^${targetEmployeeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        empOr.push({ employeeCode: targetEmployeeId });
      }
      if (targetEmployeeName) {
        empOr.push({ employeeName: { $regex: new RegExp(`^${targetEmployeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      }
      if (empOr.length > 0) {
        filter.$and = [{ $or: empOr }];
      }
    }

    if (req.query.requestType && req.query.requestType !== 'all') filter.requestType = req.query.requestType;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    if (req.query.search) {
      const q = req.query.search.trim();
      const searchOr = [
        { employeeName: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } },
        { itemName: { $regex: q, $options: 'i' } },
        { itemCode: { $regex: q, $options: 'i' } },
        { requestId: { $regex: q, $options: 'i' } },
        { reason: { $regex: q, $options: 'i' } }
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }

    const requests = await InventoryRequest.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((r) => r.toJSON())
    });
  } catch (error) {
    console.error('Error in getInventoryRequests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset requests.',
      error: error.message
    });
  }
};

/**
 * @desc    Create new uniform / asset requisition request by employee
 * @route   POST /api/inventory/requests
 */
export const createInventoryRequest = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.'
      });
    }

    const {
      requestType,
      employeeId,
      employeeName,
      designation,
      department,
      clientName,
      site,
      itemId,
      itemCode,
      itemName,
      category,
      brand,
      size,
      color,
      quantity,
      unit,
      reason,
      urgency,
      deliveryLocation,
      notes
    } = req.body;

    if (!itemName) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required.'
      });
    }

    const requestId = `REQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRequest = await InventoryRequest.create({
      recordType: 'request',
      companyId,
      adminEmail,
      requestId,
      requestDate: new Date().toISOString().slice(0, 10),
      requestType: requestType || (category === 'Uniform' ? 'uniform' : 'asset'),
      employeeId: employeeId || req.user?.employeeId || 'EMP-001',
      employeeName: employeeName || req.user?.name || 'Employee',
      designation: designation || req.user?.designation || 'Security Staff',
      department: department || req.user?.department || 'Operations',
      clientName: clientName || '',
      site: site || '',
      itemId: itemId || '',
      itemCode: itemCode || `REQ-${Math.floor(100 + Math.random() * 900)}`,
      itemName,
      category: category || 'Uniform',
      brand: brand || '',
      size: size || 'Free Size',
      color: color || 'Standard',
      quantity: Number(quantity) || 1,
      unit: unit || 'Pcs',
      reason: reason || 'New Joining',
      urgency: urgency || 'Normal',
      deliveryLocation: deliveryLocation || 'Site Location',
      notes: notes || '',
      status: 'Pending Review'
    });

    // Dynamically notify Company Admin with professional phrasing
    const isUniform = category === 'Uniform' || requestType === 'uniform';
    const requisitionTitle = `${isUniform ? 'Uniform' : 'Asset'} Requisition: ${itemName}`;
    const sizeInfo = size && size !== 'Free Size' && size !== 'Standard' ? ` (Size: ${size})` : '';
    const locationInfo = (clientName || site) ? ` (Duty Site: ${clientName || site})` : '';
    const requisitionMessage = `${employeeName || 'Staff'} (${employeeId || 'ID'}) submitted a request for ${Number(quantity) || 1}x ${itemName}${sizeInfo}${locationInfo}.`;

    await createSystemNotification({
      companyId,
      adminEmail,
      recipientRole: 'admin',
      recipientId: 'admin',
      type: isUniform ? 'uniform-request' : 'asset-request',
      title: requisitionTitle,
      message: requisitionMessage,
      employeeId: employeeId || '',
      employeeName: employeeName || 'Employee',
      clientName: clientName || site || '',
      targetModule: 'inventory',
      targetUrl: '/admin/inventory?tab=requests',
      referenceId: requestId,
      priority: urgency === 'Urgent' ? 'urgent' : urgency === 'High' ? 'important' : 'normal'
    });

    return res.status(201).json({
      success: true,
      message: `Asset request ${requestId} submitted successfully.`,
      request: newRequest.toJSON()
    });
  } catch (error) {
    console.error('Error in createInventoryRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create asset request.',
      error: error.message
    });
  }
};

/**
 * @desc    Action on request (Approve, Assign, or Reject) by Admin
 * @route   POST /api/inventory/requests/:id/action
 */
export const actionInventoryRequest = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.body.companyId;
    const { id } = req.params;
    const { action, adminRemarks, issueDate, condition, serialNumber } = req.body;

    const query = {
      recordType: 'request',
      $or: [{ requestId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const request = await InventoryRequest.findOne(query);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request record not found.'
      });
    }

    const actionBy = req.user?.name || 'Administrator';
    const actionDate = new Date().toISOString().slice(0, 10);
    const isUniform = request.category === 'Uniform' || request.requestType === 'uniform';
    const itemLabel = isUniform ? 'Uniform' : 'Asset';

    if (action === 'reject') {
      request.status = 'Rejected';
      request.adminRemarks = adminRemarks || `Request rejected by ${actionBy}.`;
      request.actionBy = actionBy;
      request.actionDate = actionDate;
      await request.save();

      // Notify the Employee with clear admin attribution
      await createSystemNotification({
        companyId: request.companyId,
        adminEmail: request.adminEmail,
        recipientRole: 'employee',
        recipientId: request.employeeId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        type: isUniform ? 'uniform-request' : 'asset-request',
        title: `${itemLabel} Requisition Rejected: ${request.itemName}`,
        message: `Your requisition request for ${request.itemName} was rejected by ${actionBy}.${adminRemarks ? ` Reason: ${adminRemarks}` : ''}`,
        targetUrl: '/employee/notifications',
        referenceId: request.requestId,
        priority: 'important'
      });

      return res.status(200).json({
        success: true,
        message: `Request ${request.requestId} was rejected.`,
        request: request.toJSON()
      });
    }

    if (action === 'approve') {
      request.status = 'Approved';
      request.adminRemarks = adminRemarks || `Approved by ${actionBy}, pending stock dispatch.`;
      request.actionBy = actionBy;
      request.actionDate = actionDate;
      await request.save();

      // Notify the Employee with clear admin attribution
      await createSystemNotification({
        companyId: request.companyId,
        adminEmail: request.adminEmail,
        recipientRole: 'employee',
        recipientId: request.employeeId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        type: isUniform ? 'uniform-request' : 'asset-request',
        title: `${itemLabel} Requisition Approved: ${request.itemName}`,
        message: `Your requisition request for ${request.quantity || 1}x ${request.itemName} has been approved by ${actionBy}.`,
        targetUrl: '/employee/notifications',
        referenceId: request.requestId,
        priority: 'normal'
      });

      return res.status(200).json({
        success: true,
        message: `Request ${request.requestId} approved successfully.`,
        request: request.toJSON()
      });
    }

    if (action === 'assign') {
      // Create new InventoryIssued record
      const issueId = `ISS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const issueType = request.requestType || (request.category === 'Uniform' ? 'uniform' : 'asset');

      const issuedRecord = await InventoryIssued.create({
        recordType: 'issued',
        companyId: request.companyId,
        adminEmail: request.adminEmail,
        issueId,
        issueDate: issueDate || actionDate,
        issueType,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        designation: request.designation,
        department: request.department,
        clientName: request.clientName,
        site: request.site,
        itemId: request.itemId || issueId,
        itemCode: request.itemCode || 'UNI-01',
        itemName: request.itemName,
        category: request.category || 'Uniform',
        brand: request.brand || 'NovaGear',
        size: request.size || 'Free Size',
        color: request.color || 'Standard',
        unit: request.unit || 'Pcs',
        quantity: request.quantity || 1,
        condition: condition || 'Brand New',
        issuedBy: actionBy,
        status: 'Issued',
        remarks: adminRemarks || `Issued against Requisition ${request.requestId}`,
        serialNumber: serialNumber || ''
      });

      request.status = 'Assigned';
      request.assignedIssueId = issueId;
      request.actionBy = actionBy;
      request.actionDate = actionDate;
      request.adminRemarks = adminRemarks || `Issued under record ${issueId} by ${actionBy}.`;
      await request.save();

      // Notify the Employee with clear admin attribution
      await createSystemNotification({
        companyId: request.companyId,
        adminEmail: request.adminEmail,
        recipientRole: 'employee',
        recipientId: request.employeeId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        type: isUniform ? 'uniform-request' : 'asset-request',
        title: `${itemLabel} Requisition Issued: ${request.itemName}`,
        message: `Your requisition request for ${request.quantity || 1}x ${request.itemName} has been assigned & issued to you by ${actionBy} (Issue ID: ${issueId}).`,
        targetUrl: '/employee/notifications',
        referenceId: issueId,
        priority: 'normal'
      });

      // Update InventoryItem stock if itemId exists
      if (request.itemId) {
        const item = await InventoryItem.findOne({
          $or: [{ itemId: request.itemId }, { itemCode: request.itemCode }],
          companyId: request.companyId
        });
        if (item) {
          item.issuedQuantity = (item.issuedQuantity || 0) + (request.quantity || 1);
          item.availableQuantity = Math.max(0, (item.availableQuantity || 0) - (request.quantity || 1));
          if (item.availableQuantity === 0) item.status = 'Out of Stock';
          else if (item.availableQuantity <= (item.minimumStock || 10)) item.status = 'Low Stock';
          await item.save();

          // Log movement
          await InventoryMovement.create({
            recordType: 'movement',
            companyId: request.companyId,
            adminEmail: request.adminEmail,
            movementId: `MOV-${Date.now().toString().slice(-6)}`,
            date: actionDate,
            itemId: item.itemId || item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            category: item.category,
            movementType: 'Issue Out',
            quantity: request.quantity || 1,
            referenceType: 'Requisition Assign',
            referenceNo: issueId,
            partyName: request.employeeName,
            balanceAfter: item.availableQuantity,
            recordedBy: actionBy,
            notes: `Assigned against employee requisition ${request.requestId}`
          });
        }
      }

      request.status = 'Assigned';
      request.assignedIssueId = issueId;
      request.adminRemarks = adminRemarks || `Assigned with Custody ID: ${issueId}`;
      request.actionBy = actionBy;
      request.actionDate = actionDate;
      await request.save();

      return res.status(200).json({
        success: true,
        message: `Asset assigned and issued to ${request.employeeName} (Issue ID: ${issueId})`,
        request: request.toJSON(),
        issued: issuedRecord.toJSON()
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action provided.'
    });
  } catch (error) {
    console.error('Error in actionInventoryRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request action.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete / Cancel request
 * @route   DELETE /api/inventory/requests/:id
 */
export const deleteInventoryRequest = async (req, res) => {
  try {
    const adminEmail = req.user.email.toLowerCase();
    const companyId = req.headers['x-company-id'] || req.query.companyId;
    const { id } = req.params;

    const query = {
      recordType: 'request',
      $or: [{ requestId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    };
    if (companyId) query.companyId = companyId;

    const result = await InventoryRequest.findOneAndDelete(query);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Requisition deleted successfully.'
    });
  } catch (error) {
    console.error('Error in deleteInventoryRequest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete request.',
      error: error.message
    });
  }
};

