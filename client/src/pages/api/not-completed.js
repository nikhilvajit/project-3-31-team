/**
 * @fileoverview API endpoint for retrieving non-completed orders with detailed item information
 * @author Alex Borgfeld
 */

import { pool } from '../../lib/db';

/**
 * Handles GET requests for retrieving active orders
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with active orders and their details
 * @throws {Error} Database or server errors
 * 
 * @description
 * - Retrieves all orders that are not marked as 'Completed' or 'Canceled'
 * - Returns order details including:
 *   - Order ID, employee ID, price, status, and time
 *   - Customer name
 *   - Aggregated list of items with special formatting for bowls, plates, and bigger plates
 *   - Sub-items and sides associated with each order
 */
export default async function handler(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT 
          o.orders_id, 
          o.employee_id, 
          o.price, 
          o.status, 
          o.order_time,
          o.customer_name, 
          ARRAY_AGG(
              CASE 
                  WHEN mi.menu_item_id = 1 THEN 'Bowl: ' || mi.name || COALESCE(' ( ' || sub_items.sub_item_list || ')', '')
                  WHEN mi.menu_item_id = 2 THEN 'Plate: ' || mi.name || COALESCE(' ( ' || sub_items.sub_item_list || ')', '')
                  WHEN mi.menu_item_id = 3 THEN 'Bigger Plate: ' || mi.name || COALESCE(' ( ' || sub_items.sub_item_list || ')', '')
                  ELSE mi.name
              END
          ) AS items
      FROM Orders o
      LEFT JOIN Order_Entry oe ON o.orders_id = oe.order_id
      LEFT JOIN Menu_Item mi ON oe.menu_item_id = mi.menu_item_id
      LEFT JOIN LATERAL (
          SELECT string_agg(sub.name, ', ') AS sub_item_list
          FROM Menu_Item sub
          WHERE sub.menu_item_id IN (oe.id1, oe.id2, oe.id3, oe.side1_id, oe.side2_id)
      ) sub_items ON TRUE
      WHERE o.status NOT IN ('Completed', 'Canceled')
      GROUP BY o.orders_id
      ORDER BY o.order_time ASC;
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Database query error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
