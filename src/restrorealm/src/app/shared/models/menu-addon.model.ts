import { Category } from "./category.model";

export interface MenuAddOn {
    id?: number;
    addOnName: string;
    name?: string;
    description?: string;
    addOnPrice: number;
    price?: number;
    active: boolean;
    suggested: boolean;
    calories: number;
    imagePath?: string;
    imageUrl?: string;
    vegetarian: boolean;
    spiceLevel?: SpiceLevel;
    allergens?: string[];
    categories?: Category[];
    createdAt?: string;
    updatedAt?: string;
}

export enum SpiceLevel {
    NONE = 'NONE',
    MILD = 'MILD',
    MEDIUM = 'MEDIUM',
    HOT = 'HOT',
    EXTRA_HOT = 'EXTRA_HOT'
}

export const SpiceLevelLabels = {
    [SpiceLevel.NONE]: 'No Spice',
    [SpiceLevel.MILD]: 'Mild',
    [SpiceLevel.MEDIUM]: 'Medium',
    [SpiceLevel.HOT]: 'Hot',
    [SpiceLevel.EXTRA_HOT]: 'Extra Hot'
};

export const SpiceLevelOptions = [
    { value: SpiceLevel.NONE, label: 'No Spice' },
    { value: SpiceLevel.MILD, label: 'Mild' },
    { value: SpiceLevel.MEDIUM, label: 'Medium' },
    { value: SpiceLevel.HOT, label: 'Hot' },
    { value: SpiceLevel.EXTRA_HOT, label: 'Extra Hot' }
];

export const CommonAllergens = [
    { id: 'gluten', name: 'Gluten' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'nuts', name: 'Nuts' },
    { id: 'soy', name: 'Soy' },
    { id: 'shellfish', name: 'Shellfish' },
    { id: 'eggs', name: 'Eggs' },
    { id: 'fish', name: 'Fish' },
    { id: 'peanuts', name: 'Peanuts' }
];
