/**
 * @fileoverview API endpoint for retrieving menu item popularity statistics by hour
 * @author Alex Borgfeld
 */

import { pool } from '../../lib/db';

/**
 * Handles GET requests for menu item popularity data
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with hourly menu item popularity data
 * @throws {Error} Database or server errors
 * 
 * @description
 * - Retrieves the most popular menu item for each hour within a specified date range
 * - Returns data including hour, item name, and sales count
 * - Only considers completed orders
 */
export default async function handler(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    // Query to find the most popular menu item for each hour within the date range
    const menuItemsPopularityQuery = `
      SELECT
        EXTRACT(HOUR FROM o.order_time) AS hour,
        mi.name AS menu_item_name,
        COUNT(oe.menu_item_id) AS sales_count
      FROM Order_Entry oe
      JOIN Menu_Item mi ON oe.menu_item_id = mi.menu_item_id
      JOIN Orders o ON oe.order_id = o.orders_id
      WHERE o.status = 'Completed'
      AND o.order_time >= $1::timestamp
      AND o.order_time <= $2::timestamp
      GROUP BY hour, mi.name
      ORDER BY hour, sales_count DESC;
    `;

    // Execute the query
    const { rows: menuItemsPopularity } = await pool.query(menuItemsPopularityQuery, [
      startDate,
      `${endDate} 23:59:59`, // Include the entire end date
    ]);

    // Map database response to include only the most popular item per hour
    const hourlyPopularity = [];
    let currentHour = null;

    for (const row of menuItemsPopularity) {
      if (row.hour !== currentHour) {
        hourlyPopularity.push({
          hour: parseInt(row.hour, 10),
          name: row.menu_item_name,
          salesCount: parseInt(row.sales_count, 10),
        });
        currentHour = row.hour;
      }
    }

    res.status(200).json(hourlyPopularity);
  } catch (error) {
    console.error('Error fetching menu items popularity data by hour:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
