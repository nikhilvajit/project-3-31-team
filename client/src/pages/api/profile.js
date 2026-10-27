/**
 * @fileoverview API endpoint for retrieving employee profile information and work hours
 * @author Adam Chawdhury
 */

import { pool } from '../../lib/db';

/**
 * Handles GET requests for employee profile data
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with employee profile and hours data
 * @throws {Error} Database or server errors
 * 
 * @description
 * - Retrieves employee profile information using employee name
 * - Returns employee ID and work hour statistics
 * - Calculates total hours worked for the last 7 days
 * - Hours are grouped by date and converted from seconds to hours
 */
export default async function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: 'Missing user name' });
  }

  try {
    // First query to get employee_id and password
    const query = 'SELECT employee_id, hashed_password FROM Employee WHERE employee_name = $1';
    const { rows } = await pool.query(query, [name]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const employeeId = rows[0].employee_id;

    // Second query to get total hours for the last 7 days
    const hoursQuery = `
        SELECT date, SUM(total_time) / 3600 AS total_hours
        FROM employee_session
        WHERE employee_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY date
        ORDER BY date ASC
    `;
    const { rows: hoursRows } = await pool.query(hoursQuery, [employeeId]);

    // Return both employee data and hours data
    res.status(200).json({
      employeeId,
      hours: hoursRows
    });

  } catch (error) {
    console.error('Error fetching user information:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
