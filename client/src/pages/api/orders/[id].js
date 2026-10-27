import { pool } from '../../../lib/db';

/**
 * @fileoverview API endpoint for managing individual orders
 * @author Alex Borgfield
 */

/**
 * Handles PUT and DELETE requests for individual orders
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} - Resolves when the operation is complete
 * @throws {Error} - If there's a database error or invalid input
 */

export default async function handler(req, res) {
  const { id } = req.query; // extract `id` from dynamic route

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;

      // Validate provided status
      const validStatuses = ['Pending', 'In Progress', 'Completed', 'Canceled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Update order in the database
      const result = await pool.query(
        'UPDATE Orders SET status = $1 WHERE orders_id = $2',
        [status, id]
      );

      // Check if any row was updated
      if (result.rowCount === 0) {
        return res.status(404).json({ message: `Order with ID ${id} not found` });
      }

      res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Delete order from the database
      const deleteOrderResult = await pool.query(
        'DELETE FROM Orders WHERE orders_id = $1',
        [id]
      );

      // Check if any row was deleted
      if (deleteOrderResult.rowCount === 0) {
        return res.status(404).json({ message: `Order with ID ${id} not found` });
      }

      res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
