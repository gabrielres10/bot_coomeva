import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistema_comidas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// API endpoints
app.get('/api/valid-values', async (req, res) => {
  try {
    // Get valid tipos from menu_proveedor
    const tiposResult = await pool.query('SELECT DISTINCT tipo FROM menu_proveedor');
    
    // Get valid sedes
    const sedesResult = await pool.query('SELECT id, nombre FROM sede');
    
    // Get valid ciudades
    const ciudadesResult = await pool.query('SELECT id, nombre FROM ciudad');
    
    // Get valid proveedores
    const proveedoresResult = await pool.query('SELECT id, nombre FROM proveedor');

    res.json({
      tipos: tiposResult.rows.map(row => row.tipo),
      sedes: sedesResult.rows,
      ciudades: ciudadesResult.rows,
      proveedores: proveedoresResult.rows
    });
  } catch (error) {
    console.error('Error getting valid values:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/menu-recommendations', async (req, res) => {
  try {
    const {
      tipo_reunion,
      sede,
      fecha,
      hora,
      asistentes,
      restricciones,
      presupuesto,
      solicitante
    } = req.query;

    let queryText = `
      SELECT 
        mp.id,
        mp.plato,
        mp.descripcion,
        mp.precio,
        mp.tipo,
        p.nombre as proveedor_nombre,
        c.nombre as ciudad_nombre
      FROM menu_proveedor mp
      JOIN proveedor p ON mp.proveedor_id = p.id
      JOIN ciudad c ON p.ciudad_id = c.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (tipo_reunion) {
      queryText += ` AND mp.tipo = $${paramIndex}`;
      queryParams.push(tipo_reunion);
      paramIndex++;
    }

    if (presupuesto && asistentes) {
      queryText += ` AND mp.precio <= $${paramIndex}`;
      queryParams.push(Number(presupuesto) / Number(asistentes));
      paramIndex++;
    }

    queryText += ` ORDER BY mp.precio ASC`;

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting menu recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 