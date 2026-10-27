import { pool } from '@/lib/db';

export async function POST(req) {
    try {
        const { menu_item_id, inventory_item_id, ingredient_amount, serving_size } = await req.json();
        
        const query = `
            INSERT INTO Recipe (
                menu_item_id,
                inventory_item_id,
                ingredient_amount,
                serving_size
            ) VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [
            menu_item_id,
            inventory_item_id,
            ingredient_amount,
            serving_size
        ]);
        
        return Response.json(rows[0]);
    } catch (error) {
        console.error('Error creating recipe:', error);
        return Response.json({ error: 'Failed to create recipe' }, { status: 500 });
    }
}