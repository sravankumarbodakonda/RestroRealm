import { MenuOption } from './menu-option.model';

export enum CustomizationPosition {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    WHOLE = 'WHOLE',
    NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export const CustomizationPositionOptions = [
    { value: CustomizationPosition.LEFT, label: 'Left Side Only' },
    { value: CustomizationPosition.RIGHT, label: 'Right Side Only' },
    { value: CustomizationPosition.WHOLE, label: 'Whole Item' },
    { value: CustomizationPosition.NOT_APPLICABLE, label: 'Not Applicable' }
];

export enum CustomizationQuantity {
    NONE = 'NONE',
    LIGHT = 'LIGHT',
    REGULAR = 'REGULAR',
    EXTRA = 'EXTRA',
    DOUBLE = 'DOUBLE'
}

export const CustomizationQuantityOptions = [
    { value: CustomizationQuantity.NONE, label: 'None' },
    { value: CustomizationQuantity.LIGHT, label: 'Light', multiplier: 0.5 },
    { value: CustomizationQuantity.REGULAR, label: 'Regular', multiplier: 1.0 },
    { value: CustomizationQuantity.EXTRA, label: 'Extra', multiplier: 1.5 },
    { value: CustomizationQuantity.DOUBLE, label: 'Double', multiplier: 2.0 }
];

export interface CustomizationGroup {
    id?: number;
    name: string;
    description?: string;
    required: boolean;
    allowMultiple: boolean;
    positionEnabled: boolean;
    quantityEnabled: boolean;
    minSelect?: number;
    maxSelect?: number;
    priceImpact: 'FREE' | 'ADDITIONAL' | 'INCLUDED';
    options: MenuOption[] | number[];
    displayOrder?: number;
    active: boolean;
    imagePath?: string;
    createdAt?: string;
    updatedAt?: string;
}
