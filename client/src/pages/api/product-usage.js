/**
 * @fileoverview API endpoint for retrieving product usage statistics and revenue data
 * @author Alex Borgfeld
 */

import { pool } from '../../lib/db';

/**
 * Handles GET requests for product usage statistics
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with product usage statistics
 * @throws {Error} Database or server errors
 * 
 * @description
 * - Retrieves usage statistics and revenue for menu items
 * - Returns for each item:
 *   - Item name
 *   - Usage count (number of times ordered)
 *   - Total revenue generated
 */
export default async function handler(req, res) {
  try {
    const { startDate, endDate } = req.query;

    // Default date range to the past month
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
    const formattedStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const formattedEndDate = endDate || new Date().toISOString().split('T')[0];

    console.log('Start Date:', formattedStartDate, 'End Date:', formattedEndDate);

    // Query for product usage and total price
    const productUsageQuery = `
      SELECT 
        mi.name AS item_name,
        COUNT(*) AS usage_count,
        SUM(oe.entry_price) AS total_price -- Calculate the total price for each item
      FROM Order_Entry oe
      JOIN Menu_Item mi ON oe.menu_item_id = mi.menu_item_id
      JOIN Orders o ON oe.order_id = o.orders_id
      WHERE o.status = 'Completed'
      AND ($1::date IS NULL OR o.order_time >= $1::date)
      AND ($2::date IS NULL OR o.order_time <= $2::date)
      GROUP BY mi.name
      ORDER BY usage_count DESC;
    `;

    // Execute the query
    const { rows: productUsage } = await pool.query(productUsageQuery, [
      formattedStartDate,
      formattedEndDate,
    ]);

    // Map database response to match frontend state structure
    res.status(200).json(
      productUsage.map((item) => ({
        name: item.item_name,
        usageCount: parseInt(item.usage_count, 10) || 0, // Ensure usageCount is an integer
        totalPrice: parseFloat(item.total_price) || 0,   // Ensure totalPrice is a float
      }))
    );
  } catch (error) {
    console.error('Error fetching product usage data:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
