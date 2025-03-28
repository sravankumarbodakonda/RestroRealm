import { Permission } from "./permission.model";

export interface Role {
  status: string;
  createdBy: string;
  createdAt: number;
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
}