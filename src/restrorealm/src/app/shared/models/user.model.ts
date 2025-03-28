import { Permission } from "./permission.model";

export interface User {

    id?: number;

    name: string;

    phone: any;

    email: string;

    dateOfBirth: any;

    password?: string;

    role?: string;

    roleName?: string;

    profilePicture?: string;

    permissionDtoSet?: Permission[];

    street1?: string;

    street2?: string;

    city?: string;

    state?: string;

    postalCode?: number;
}
