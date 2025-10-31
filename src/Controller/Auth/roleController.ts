import { Request, Response } from 'express';
import Role from '../../Model/roleModel';

export const createRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roleName, roleStatus } = req.body;

    if (!roleName) {
      res.status(400).json({ message: 'Role name is required' });
      return;
    }

    const newRole = new Role({
      roleName,
      roleStatus: roleStatus || 'active',
    });

    const savedRole = await newRole.save();
    res.status(201).json(savedRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllRoles = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRoleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const role = await Role.findOne({ roleId: id });

    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { roleName, roleStatus } = req.body;

    const updatedRole = await Role.findOneAndUpdate(
      { roleId: id },
      { roleName, roleStatus },
      { new: true, runValidators: true }
    );

    if (!updatedRole) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    res.status(200).json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
