
import * as workspaceRepository from "../repositories/workspaceRepository.js";

export const createWorkspace = async (data) => {
  const name = data.name?.trim();

  if (!name) {
    const error = new Error("Workspace name is required");
    error.statusCode = 400;
    throw error;
  }

  return workspaceRepository.createWorkspace({
    ...data,
    name,
    description: data.description?.trim() || "",
  });
};

export const getWorkspaces = async (userId) => {
  return await workspaceRepository.getWorkspacesByUser(userId);
};

export const getWorkspaceById = async (workspaceId, userId) => {
  const workspace = await workspaceRepository.getWorkspaceById(
    workspaceId,
    userId
  );

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return workspace;
};


export const updateWorkspace = async (id, userId, data) => {
  const workspace = await workspaceRepository.updateWorkspace(
    id,
    userId,
    data
  );

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return workspace;
};

export const deleteWorkspace = async (id, userId) => {
  const workspace = await workspaceRepository.deleteWorkspace(
    id,
    userId
  );

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  return workspace;
};
