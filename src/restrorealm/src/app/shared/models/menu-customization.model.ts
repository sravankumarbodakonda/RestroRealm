import { Category } from './category.model';

export enum CustomizationType {
  TOPPING = 'TOPPING',
  PREPARATION = 'PREPARATION',
  PORTION = 'PORTION',
  SUBSTITUTION = 'SUBSTITUTION',
  EXTRA = 'EXTRA'
}

export const CustomizationTypeOptions = [
  { value: CustomizationType.TOPPING, label: 'Topping' },
  { value: CustomizationType.PREPARATION, label: 'Preparation' },
  { value: CustomizationType.PORTION, label: 'Portion' },
  { value: CustomizationType.SUBSTITUTION, label: 'Substitution' },
  { value: CustomizationType.EXTRA, label: 'Extra' }
];

export interface MenuCustomizationOption {
  id?: number;
  optionName: string;
  description?: string;
  additionalPrice: number;
  default?: boolean;
  active: boolean;
  imagePath?: string;
  calories?: number;
}

export interface MenuCustomization {
  id?: number;
  name: string;
  customizationName?: string;
  description?: string;
  required: boolean;
  active: boolean;
  multiSelect: boolean;
  maxSelections?: number;
  customizationType: CustomizationType;
  options: MenuCustomizationOption[];
  displayOrder?: number;
  categories?: Category[];
  createdAt?: string;
  updatedAt?: string;
  imagePath?: string;
}
