/**
 * @fileoverview API endpoint for kiosk operations including menu management and order processing
 * @author Nikhil Ajit
 */

import { pool } from '@/lib/db';

/**
 * Handles HTTP requests for kiosk operations
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with menu items or order confirmation
 * @throws {Error} Database or server errors
 * 
 * @description
 * - GET: Retrieves all available menu items with ratings and availability
 * - PUT: Updates menu item availability
 * - POST: Processes new orders or updates item ratings
 */
export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const query = `
                SELECT 
                    menu_item_id,
                    price,
                    name,
                    amount_available,
                    type,
                    description,
                    expiry_date,
                    ratings_sum,
                    ratings_count,
                    CASE 
                        WHEN ratings_count > 0 THEN ratings_sum::float / ratings_count
                        ELSE NULL
                    END AS average_rating
                FROM Menu_Item
                WHERE (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
                ORDER BY
                    CASE type
                        WHEN 'category' THEN 1
                        WHEN 'side' THEN 2
                        WHEN 'entree' THEN 3
                        WHEN 'premium entree' THEN 4
                        WHEN 'appetizer' THEN 5
                        WHEN 'dessert' THEN 6
                        WHEN 'drink' THEN 7
                        ELSE 8
                    END,
                    name;
            `;
            
            const { rows } = await pool.query(query);
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            res.status(500).json({ error: 'Failed to fetch menu items' });
        }
    } else if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data.ratings) {
                // Forward non-rating requests to orders endpoint
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                return res.status(response.status).json(result);
            }

            // Handle ratings update
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                for (const rating of data.ratings) {
                    if (rating.rating !== null) {
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
                res.status(200).json({ 
                    success: true, 
                    message: 'Ratings updated successfully' 
                });
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error processing request:', error);
            res.status(500).json({ 
                error: 'Failed to process request',
                details: error.message 
            });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}