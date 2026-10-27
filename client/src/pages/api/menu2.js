import { pool } from '@/lib/db';

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
          COALESCE(description, '') AS description
        FROM menu_item
        ORDER BY type, name;
      `;
      
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ error: 'Failed to fetch menu items' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}