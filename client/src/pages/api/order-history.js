/**
 * @fileoverview API endpoint for retrieving detailed order history with item contents
 * @author 
 */

import { pool } from '@/lib/db';

/**
 * Handles GET requests for order history
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with detailed order history
 * @throws {Error} Database or server errors
 * 
 * @description
 * - Retrieves complete order history with detailed information including:
 *   - Order ID and total price
 *   - Employee name who handled the order
 *   - Detailed order contents with customizations
 *   - Order date and status
 *   - Customer name
 * - Special handling for menu items 1-3 to include their components and sides
 * - Orders are sorted by ID in descending order (most recent first)
 */
export default async function handler(req, res) {
  try {
    // Extract query parameters for date filtering
    const { startDate, endDate } = req.query;

    // Base SQL query
    let query = `
      WITH order_details AS (
        SELECT 
        o.orders_id,
        o.price AS total,
        o.order_time,
        o.status,
        o.customer_name,
        e.employee_name AS employee,

        ARRAY_TO_STRING(
          ARRAY_AGG(DISTINCT
            CASE WHEN oe.menu_item_id <= 3 THEN 
                mi.name || ' (' || 
                ARRAY_TO_STRING(
                ARRAY[
                    CASE WHEN oe.id1 >= 0 THEN 
                    (SELECT name FROM menu_item WHERE menu_item_id = oe.id1) 
                    ELSE NULL END,
                    CASE WHEN oe.id2 >= 0 THEN 
                    (SELECT name FROM menu_item WHERE menu_item_id = oe.id2) 
                    ELSE NULL END,
                    CASE WHEN oe.id3 >= 0 THEN 
                    (SELECT name FROM menu_item WHERE menu_item_id = oe.id3) 
                    ELSE NULL END,
                    CASE WHEN oe.side1_id >= 0 THEN 
                    (SELECT name FROM menu_item WHERE menu_item_id = oe.side1_id)
                    ELSE NULL END,
                    CASE WHEN oe.side2_id >= 0 THEN 
                    (SELECT name FROM menu_item WHERE menu_item_id = oe.side2_id)
                    ELSE NULL END
                ], ', ') || ')'
            ELSE mi.name END
          ), ', ') AS contents

        FROM 
          orders o
        JOIN 
          order_entry oe ON o.orders_id = oe.order_id
        LEFT JOIN 
          employee e ON o.employee_id = e.employee_id
        LEFT JOIN
          menu_item mi ON oe.menu_item_id = mi.menu_item_id
        GROUP BY 
          o.orders_id, o.price, o.order_time, o.status, o.customer_name, e.employee_name
        ORDER BY 
          o.orders_id DESC
      )
      
      SELECT 
        orders_id AS order_id,
        total,
        employee,
        contents,
        order_time AS date,
        status,
        customer_name
      FROM 
        order_details
    `;

    // Add date filtering conditions
    const queryParams = [];
    if (startDate || endDate) {
      query += ` WHERE `;
      if (startDate) {
        query += `order_time >= $1 `;
        queryParams.push(startDate);
      }
      if (startDate && endDate) {
        query += `AND `;
      }
      if (endDate) {
        query += `order_time <= $2 `;
        queryParams.push(endDate);
      }
    }

    // Execute the query
    const { rows } = await pool.query(query, queryParams);

    // Send the response
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Order History Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
