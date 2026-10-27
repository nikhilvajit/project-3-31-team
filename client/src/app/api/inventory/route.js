import { pool } from '@/lib/db';

export async function GET(req) {
  try {
    const query = `
      SELECT 
        inventory_item_id,
        name,
        quantity,
        target_quantity,
        expiration_date
      FROM Inventory_Item
      ORDER BY name;
    `;
    
    const { rows } = await pool.query(query);
    return Response.json(rows);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return Response.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
      const data = await req.json();
      const { name, quantity, target_quantity, expiration_date } = data;

      // First, get the next available inventory_item_id
      const idQuery = 'SELECT COALESCE(MAX(inventory_item_id), 0) + 1 as next_id FROM Inventory_Item';
      const idResult = await pool.query(idQuery);
      const inventoryItemId = idResult.rows[0].next_id;

      // Add inventory item to database with the generated ID
      const query = `
          INSERT INTO Inventory_Item (
              inventory_item_id,
              name,
              quantity,
              target_quantity,
              expiration_date
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
      `;
      
      const { rows } = await pool.query(query, [
          inventoryItemId,
          name,
          quantity,
          target_quantity,
          expiration_date
      ]);
      
      return Response.json(rows[0]);
  } catch (error) {
      console.error('Error creating inventory item:', error);
      return Response.json(
          { error: 'Failed to create inventory item: ' + error.message }, 
          { status: 500 }
      );
  }
}

export async function PUT(req) {
  try {
    const { name, quantity, target_quantity, expiration_date } = await req.json();
    
    const query = `
      UPDATE Inventory_Item
      SET 
        quantity = $1,
        target_quantity = $2,
        expiration_date = $3
      WHERE name = $4
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [quantity, target_quantity, expiration_date, name]);
    
    if (rows.length === 0) {
      return Response.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    return Response.json(rows[0]);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return Response.json({ error: 'Failed to update inventory: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { name } = await req.json();
    
    const query = `
      DELETE FROM Inventory_Item
      WHERE name = $1
      RETURNING *;
    `;
    
    const { rows } = await pool.query(query, [name]);
    
    if (rows.length === 0) {
      return Response.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    
    return Response.json(rows[0]);
  } catch (error) {
    console.error('Error removing inventory item:', error);
    return Response.json({ error: 'Failed to remove inventory item: ' + error.message }, { status: 500 });
  }
}