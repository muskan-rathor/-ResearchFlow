
import { pool } from "../config/database.js";

export const createWorkspace = async ({
  name,
  description,
  createdBy,
}) => {
  const query = `
    INSERT INTO workspaces (name, description, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, description, created_by, created_at;
  `;

  const values = [name, description, createdBy];

  const result = await pool.query(query, values);

  return result.rows[0];
};


export const getWorkspacesByUser = async (userId) => {
  const query = `
    SELECT id, name, description, created_by, created_at
    FROM workspaces
    WHERE created_by = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [userId]);

  return result.rows;
};


export const getWorkspaceById = async (workspaceId, userId) => {
  const result = await pool.query(
    `SELECT id, name, description, created_by, created_at
     FROM workspaces
     WHERE id = $1 AND created_by = $2`,
    [workspaceId, userId]
  );

  return result.rows[0];
};


export const updateWorkspace = async (id, userId, data) => {
  const result = await pool.query(
    `UPDATE workspaces
     SET name = $1,
         description = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND created_by = $4
     RETURNING id, name, description, created_by, updated_at`,
    [data.name, data.description, id, userId]
  );

  return result.rows[0];
};

export const deleteWorkspace = async (id, userId) => {
  const result = await pool.query(
    `DELETE FROM workspaces
     WHERE id = $1 AND created_by = $2
     RETURNING id`,
    [id, userId]
  );

  return result.rows[0];
};
