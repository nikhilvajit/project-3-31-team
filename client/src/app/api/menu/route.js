import { writeFile } from 'fs/promises';
import { join } from 'path';
import { pool } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                menu_item_id,
                price,
                name,
                amount_available,
                type,
                description,
                expiry_date
            FROM Menu_Item
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
        console.log('Database returned rows:', rows); // Add this log
        return Response.json(rows);
    } catch (error) {
        console.error('Error in GET:', error); // Add this log
        return Response.json(
            { error: 'Failed to fetch menu items' }, 
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const formData = await req.formData();
        const image = formData.get('image');
        const name = formData.get('name');
        const type = formData.get('type');
        const price = parseFloat(formData.get('price'));
        const description = formData.get('description') || null;
        const expiry_date = formData.get('expiry_date') || null;
        
        // First, get the next available menu_item_id
        const idQuery = 'SELECT COALESCE(MAX(menu_item_id), 0) + 1 as next_id FROM Menu_Item';
        const idResult = await pool.query(idQuery);
        const menuItemId = idResult.rows[0].next_id;

        // Add menu item to database with the generated ID
        const query = `
            INSERT INTO Menu_Item (menu_item_id, name, type, price, amount_available, description, expiry_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [menuItemId, name, type, price, 0, description, expiry_date]);
        
        // Handle image upload if present
        if (image) {
            try {
                const bytes = await image.arrayBuffer();
                const buffer = Buffer.from(bytes);
                
                const imageName = `${type}${name}.png`;
                const path = join(process.cwd(), 'public', 'images', imageName);
                await writeFile(path, buffer);
            } catch (imageError) {
                console.error('Error saving image:', imageError);
            }
        }
        
        return Response.json(rows[0]);
    } catch (error) {
        console.error('Error creating menu item:', error);
        return Response.json(
            { error: 'Failed to create menu item: ' + error.message }, 
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const formData = await req.formData();
        const image = formData.get('image');
        const menu_item_id = parseInt(formData.get('menu_item_id'));
        const name = formData.get('name');
        const type = formData.get('type');
        const price = parseFloat(formData.get('price'));
        const description = formData.get('description') || null;
        const expiry_date = formData.get('expiry_date') || null;
        
        // Update menu item in database
        const query = `
            UPDATE Menu_Item
            SET name = $1, 
                type = $2, 
                price = $3, 
                description = $4, 
                expiry_date = $5
            WHERE menu_item_id = $6
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [name, type, price, description, expiry_date, menu_item_id]);
        
        // Handle image update if present
        if (image) {
            try {
                const bytes = await image.arrayBuffer();
                const buffer = Buffer.from(bytes);
                
                const imageName = `${type}${name}.png`;
                const path = join(process.cwd(), 'public', 'images', imageName);
                await writeFile(path, buffer);
            } catch (imageError) {
                console.error('Error saving image:', imageError);
            }
        }
        
        return Response.json(rows[0]);
    } catch (error) {
        console.error('Error updating menu item:', error);
        return Response.json(
            { error: 'Failed to update menu item' }, 
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        const data = await req.json();
        const { menu_item_id } = data;

        // First delete associated recipe entries
        const deleteRecipeQuery = `
            DELETE FROM Recipe 
            WHERE menu_item_id = $1
        `;
        await pool.query(deleteRecipeQuery, [menu_item_id]);

        // Then delete the menu item
        const deleteMenuQuery = `
            DELETE FROM Menu_Item 
            WHERE menu_item_id = $1
            RETURNING *;
        `;
        
        const { rows } = await pool.query(deleteMenuQuery, [menu_item_id]);

        if (rows.length === 0) {
            return Response.json(
                { error: 'Menu item not found' }, 
                { status: 404 }
            );
        }

        return Response.json(rows[0]);
    } catch (error) {
        console.error('Error deleting menu item:', error);
        return Response.json(
            { error: 'Failed to delete menu item' }, 
            { status: 500 }
        );
    }
}