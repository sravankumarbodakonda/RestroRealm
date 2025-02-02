import { Permission } from "./permission.model";

export interface User {

    id?: number;

    name: string;

    email: string;

    password?: string;

    role?: string;

    profilePicture?: string;

    permissionDtoSet?: Permission[];
}
