/**
 * @fileoverview API endpoint for analyzing item co-purchase patterns
 * @author Alex Borgfeld
 */

import { pool } from '../../lib/db';

/**
 * Handles GET requests for analyzing which menu items are frequently purchased together
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with co-purchase frequency data
 * @throws {Error} Database or server errors
 * 
 * @description
 * Analyzes order data to identify patterns of items purchased together:
 * - Finds pairs of items that appear in the same order
 * - Counts frequency of each pair's co-occurrence
 * - Only considers completed orders
 * - Results sorted by frequency in descending order
 * 
 * Response Format:
 * Array of objects with:
 * - item1: Name of first item in pair
 * - item2: Name of second item in pair
 * - frequency: Number of times these items were purchased together
 * 
 * Date Range:
 * - Default range is past month if dates not specified
 * - Can be customized via startDate and endDate parameters
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

    // Query to find pairs of items sold together
    const whatSellsTogetherQuery = `
      SELECT
        mi1.name AS item1,
        mi2.name AS item2,
        COUNT(*) AS frequency
      FROM Order_Entry oe1
      JOIN Order_Entry oe2 ON oe1.order_id = oe2.order_id AND oe1.menu_item_id < oe2.menu_item_id
      JOIN Menu_Item mi1 ON oe1.menu_item_id = mi1.menu_item_id
      JOIN Menu_Item mi2 ON oe2.menu_item_id = mi2.menu_item_id
      JOIN Orders o ON oe1.order_id = o.orders_id
      WHERE o.status = 'Completed'
      AND ($1::date IS NULL OR o.order_time >= $1::date)
      AND ($2::date IS NULL OR o.order_time <= $2::date)
      GROUP BY mi1.name, mi2.name
      ORDER BY frequency DESC;
    `;

    // Execute the query
    const { rows: whatSellsTogether } = await pool.query(whatSellsTogetherQuery, [
      formattedStartDate,
      formattedEndDate,
    ]);

    // Map the result to a frontend-friendly structure
    res.status(200).json(
      whatSellsTogether.map((row) => ({
        item1: row.item1,
        item2: row.item2,
        frequency: parseInt(row.frequency, 10),
      }))
    );
  } catch (error) {
    console.error('Error fetching what sells together data:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
