/**
 * @fileoverview API endpoint for batch updating menu item ratings
 * @author Nikhil Ajit
 */

import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Handles POST requests for updating menu item ratings in batch
 * @async
 * @function POST
 * @param {Request} request - The HTTP request object containing ratings data
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 * @throws {Error} Database or server errors
 * 
 * @description
 * - Processes batch updates of menu item ratings
 * - Uses database transaction for data consistency
 * - Updates both ratings_sum and ratings_count for each item
 * - Skips items with null ratings
 * - Expected request body format:
 *   {
 *     ratings: Array<{
 *       menuItemId: number,
 *       rating: number | null
 *     }>
 *   }
 */
export async function POST(request: Request) {
  try {
    const { ratings } = await request.json();
    
    // Start a transaction since we're doing multiple updates
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const rating of ratings) {
        if (rating.rating !== null) { // Only process items that were rated
          const updateQuery = `
            UPDATE Menu_Item
            SET 
              ratings_sum = COALESCE(ratings_sum, 0) + $1,
              ratings_count = COALESCE(ratings_count, 0) + 1
            WHERE menu_item_id = $2;
          `;
          await client.query(updateQuery, [rating.rating, rating.menuItemId]);
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Ratings updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating ratings:', error);
    return NextResponse.json(
      { error: 'Failed to update ratings' },
      { status: 500 }
    );
  }
}