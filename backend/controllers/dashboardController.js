const Fitness = require('../models/Fitness');
const Puc = require('../models/Puc');
const Gps = require('../models/Gps');
const Tax = require('../models/Tax');
const BusPermit = require('../models/BusPermit');
const NationalPermit = require('../models/NationalPermit');
const CgPermit = require('../models/CgPermit');
const Insurance = require('../models/Insurance');
const TemporaryPermit = require('../models/TemporaryPermit');
const TemporaryPermitOtherState = require('../models/TemporaryPermitOtherState');
const mongoose = require('mongoose');

exports.getDashboardData = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [
      fitnessStats,
      fitnessExpiring,
      pucStats,
      pucExpiring,
      gpsStats,
      gpsExpiring,
      taxStats,
      taxExpiring,
      busPermitStats,
      busPermitExpiring,
      nationalPermitStats,
      nationalPermitExpiring,
      cgPermitStats,
      cgPermitExpiring,
      insuranceStats,
      insuranceExpiring,
      temporaryPermitStats,
      temporaryPermitExpiring,
      temporaryPermitOtherStateStats,
      temporaryPermitOtherStateExpiring,
    ] = await Promise.all([
      // Fitness
      Fitness.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Fitness.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // PUC
      Puc.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Puc.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // GPS
      Gps.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Gps.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // Tax
      Tax.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Tax.find({ userId, status: 'expiring_soon' }).sort({ taxTo: 1 }),

      // Bus Permit
      BusPermit.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      BusPermit.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // National Permit
      NationalPermit.aggregate([
        { $match: { userId } },
        { 
          $group: { 
            _id: null, 
            total: { $sum: 1 },
            partAExpiringSoon: { $sum: { $cond: [{ $eq: ['$partAStatus', 'expiring_soon'] }, 1, 0] } },
            partBExpiringSoon: { $sum: { $cond: [{ $eq: ['$partBStatus', 'expiring_soon'] }, 1, 0] } }
          } 
        }
      ]),
      NationalPermit.find({ 
        userId, 
        $or: [
          { partAStatus: 'expiring_soon' },
          { partBStatus: 'expiring_soon' }
        ] 
      }),

      // CG Permit
      CgPermit.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      CgPermit.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // Insurance
      Insurance.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Insurance.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // Temporary Permit
      TemporaryPermit.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      TemporaryPermit.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),

      // Temporary Permit Other State
      TemporaryPermitOtherState.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      TemporaryPermitOtherState.find({ userId, status: 'expiring_soon' }).sort({ validTo: 1 }),
    ]);

    // Third-party insurance expiry — separate query because it's not based on status
    const allInsuranceWithThirdParty = await Insurance.find({
      userId,
      thirdPartyValidTo: { $exists: true, $ne: '' }
    }).lean()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    thirtyDaysFromNow.setHours(23, 59, 59, 999)

    const insuranceThirdPartyExpiring = allInsuranceWithThirdParty
      .filter(r => {
        if (!r.thirdPartyValidTo) return false
        const parts = r.thirdPartyValidTo.split('-')
        if (parts.length !== 3) return false
        const expDate = new Date(parts[2], parts[1] - 1, parts[0])
        return expDate >= today && expDate <= thirtyDaysFromNow
      })
      .sort((a, b) => {
        const aParts = a.thirdPartyValidTo.split('-')
        const bParts = b.thirdPartyValidTo.split('-')
        const aDate = new Date(aParts[2], aParts[1] - 1, aParts[0])
        const bDate = new Date(bParts[2], bParts[1] - 1, bParts[0])
        return aDate - bDate
      })

    const formatStats = (stats) => {
      const result = { total: 0, active: 0, expiringSoon: 0, expired: 0 };
      let total = 0;
      stats.forEach(s => {
        if(s._id === 'active') result.active = s.count;
        if(s._id === 'expiring_soon') result.expiringSoon = s.count;
        if(s._id === 'expired') result.expired = s.count;
        total += s.count;
      });
      result.total = total;
      return result;
    };

    res.json({
      success: true,
      data: {
        statistics: {
          fitness: formatStats(fitnessStats),
          puc: formatStats(pucStats),
          gps: formatStats(gpsStats),
          tax: { ...formatStats(taxStats), expiring: formatStats(taxStats).expiringSoon },
          busPermit: formatStats(busPermitStats),
          nationalPermit: Array.isArray(nationalPermitStats) 
            ? (nationalPermitStats[0] || { total: 0, partAExpiringSoon: 0, partBExpiringSoon: 0 }) 
            : nationalPermitStats,
          cgPermit: formatStats(cgPermitStats),
          insurance: formatStats(insuranceStats),
          temporaryPermit: formatStats(temporaryPermitStats),
          temporaryPermitOtherState: formatStats(temporaryPermitOtherStateStats),
        },
        expiringRecords: {
          fitness: fitnessExpiring,
          puc: pucExpiring,
          gps: gpsExpiring,
          tax: taxExpiring,
          busPermit: busPermitExpiring,
          nationalPermit: nationalPermitExpiring,
          cgPermit: cgPermitExpiring,
          insurance: insuranceExpiring,
          insuranceThirdParty: insuranceThirdPartyExpiring,
          temporaryPermit: temporaryPermitExpiring,
          temporaryPermitOtherState: temporaryPermitOtherStateExpiring,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};
