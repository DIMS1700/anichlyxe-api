import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';

// CUSTOMER: Pastikan Anda menaruh file kredensial Service Account Google Cloud 
// dengan nama 'ga-credentials.json' di dalam folder 'api/' ini.
const credentialsPath = path.join(process.cwd(), 'api', 'ga-credentials.json');

// CUSTOMER: GANTI DENGAN PROPERTY ID GA4 ANDA (ANGKA SAJA, BUKAN G-XXXX)
// Temukan di Google Analytics -> Admin -> Property Settings -> Property ID
const propertyId = 'MASUKKAN_PROPERTY_ID_GA4_DISINI'; 

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: credentialsPath,
});

export default async function handler(req, res) {
  try {
    // 1. Get Realtime Active Users
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
    });

    const activeUsers = realtimeResponse.rows 
      ? realtimeResponse.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)
      : 0;

    // 2. Get Total Views (Last 28 days or All Time)
    const [reportResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '2023-01-01', // Sejak awal
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' }
      ],
    });

    const totalViews = reportResponse.rows && reportResponse.rows[0]
      ? reportResponse.rows[0].metricValues[0].value
      : 0;
      
    const totalUsers = reportResponse.rows && reportResponse.rows[0]
      ? reportResponse.rows[0].metricValues[1].value
      : 0;

    res.status(200).json({
      success: true,
      data: {
        activeUsers,
        totalViews,
        totalUsers
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: "Pastikan Property ID di api/analytics.js sudah benar (Angka, bukan G-xxx) dan file ga-credentials.json sudah ada." 
    });
  }
}