/**
 * @fileoverview API endpoint for processing new orders and managing inventory
 * @author Alex Borgfeld
 */

import { pool } from '@/lib/db';

/**
 * Updates inventory quantities for a menu item's ingredients
 * @async
 * @function updateInventoryForMenuItem
 * @param {number} menuItemId - ID of the menu item
 * @param {Object} client - PostgreSQL client for transaction
 * @throws {Error} If insufficient inventory for any ingredient
 */
async function updateInventoryForMenuItem(menuItemId, client) {
    // Get recipe ingredients for the menu item
    const recipeQuery = `
        SELECT inventory_item_id, ingredient_amount
        FROM Recipe
        WHERE menu_item_id = $1;
    `;
    const recipeResult = await client.query(recipeQuery, [menuItemId]);
    
    // Update inventory for each ingredient
    for (const ingredient of recipeResult.rows) {
        const updateQuery = `
            UPDATE Inventory_Item
            SET quantity = quantity - $1
            WHERE inventory_item_id = $2
            RETURNING quantity;
        `;
        const updateResult = await client.query(updateQuery, [
            ingredient.ingredient_amount,
            ingredient.inventory_item_id
        ]);
        
        // Check if inventory is running low
        if (updateResult.rows[0].quantity < 0) {
            throw new Error(`Insufficient inventory for item ${ingredient.inventory_item_id}`);
        }
    }
}

/**
 * Handles POST requests for creating new orders
 * @async
 * @function handler
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} JSON response with order confirmation
 * @throws {Error} Database or inventory errors
 * 
 * @description
 * - Creates a new order with multiple menu items
 * - Handles special cases for bowls, plates, and bigger plates (menu items 1-3)
 * - Manages inventory updates for all ordered items
 * - Uses database transactions to ensure data consistency
 * - Automatically generates sequential IDs for orders and entries
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const client = await pool.connect();
    
    try {
        const { customerName, employeeId, price, items } = req.body;
        
        await client.query('BEGIN');
        
        // Get next order ID
        const maxIdQuery = `
            SELECT COALESCE(MAX(orders_id), 0) + 1 as next_id 
            FROM Orders;
        `;
        const maxIdResult = await client.query(maxIdQuery);
        const nextOrderId = maxIdResult.rows[0].next_id;
        
        // Create the order
        const orderQuery = `
            INSERT INTO Orders (
                orders_id, 
                employee_id, 
                price, 
                order_time, 
                status,
                customer_name
            )
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'Pending', $4)
            RETURNING orders_id;
        `;
        
        const orderResult = await client.query(orderQuery, [
            nextOrderId,
            employeeId || 0,
            price,
            customerName || null
        ]);
        
        const orderId = orderResult.rows[0].orders_id;
        
        // Get next order entry ID
        const maxEntryIdQuery = `
            SELECT COALESCE(MAX(order_entry_id), 0) + 1 as next_id 
            FROM Order_Entry;
        `;
        const maxEntryIdResult = await client.query(maxEntryIdQuery);
        let nextEntryId = maxEntryIdResult.rows[0].next_id;
        
        // Process each cart entry
        for (const entry of items) {
            if (["Bowl", "Plate", "Bigger Plate"].includes(entry.category)) {
                // Get the category menu item ID
                const categoryQuery = `
                    SELECT menu_item_id 
                    FROM Menu_Item 
                    WHERE name = $1 AND type = 'category';
                `;
                const categoryResult = await client.query(categoryQuery, [entry.category]);
                const categoryId = categoryResult.rows[0].menu_item_id;
                
                // Sort items into sides and entrees
                const sides = entry.items.filter(i => i.type === 'side');
                const entrees = entry.items.filter(i => 
                    i.type === 'entree' || i.type === 'premium entree'
                );
                
                // Create one order entry for the combo
                const entryQuery = `
                    INSERT INTO Order_Entry (
                        order_entry_id,
                        order_id, 
                        menu_item_id, 
                        id1, 
                        id2, 
                        id3, 
                        side1_id, 
                        side2_id, 
                        entry_price
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
                `;
                
                await client.query(entryQuery, [
                    nextEntryId,
                    orderId,
                    categoryId,
                    entrees[0]?.menu_item_id || -1,
                    entrees[1]?.menu_item_id || -1,
                    entrees[2]?.menu_item_id || -1,
                    sides[0]?.menu_item_id || -1,
                    -1, // side2_id not used
                    entry.price
                ]);
                
                // Update inventory for each component
                for (const item of [...sides, ...entrees]) {
                    await updateInventoryForMenuItem(item.menu_item_id, client);
                }
                
                nextEntryId++;
            } else {
                // For individual items (A La Carte, Appetizers, Drinks)
                for (const item of entry.items) {
                    const entryQuery = `
                        INSERT INTO Order_Entry (
                            order_entry_id,
                            order_id, 
                            menu_item_id,
                            id1,
                            id2,
                            id3,
                            side1_id,
                            side2_id,
                            entry_price
                        )
                        VALUES ($1, $2, $3, -1, -1, -1, -1, -1, $4);
                    `;
                    
                    await client.query(entryQuery, [
                        nextEntryId,
                        orderId,
                        item.menu_item_id,
                        entry.price
                    ]);
                    
                    // Update inventory for individual item
                    await updateInventoryForMenuItem(item.menu_item_id, client);
                    
                    nextEntryId++;
                }
            }
        }
        
        await client.query('COMMIT');
        
        res.status(200).json({ 
            success: true, 
            orderId,
            message: 'Order created successfully' 
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing order:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to process order',
            details: error.message 
        });
    } finally {
        client.release();
    }
}