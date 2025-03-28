import { Category } from './category.model';

export enum SelectionType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
  RANGE = 'RANGE'
}

export enum DisplayStyle {
  DROPDOWN = 'DROPDOWN',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  SLIDER = 'SLIDER'
}

export const SelectionTypeOptions = [
  { value: SelectionType.SINGLE, label: 'Single Selection' },
  { value: SelectionType.MULTIPLE, label: 'Multiple Selection' },
  { value: SelectionType.RANGE, label: 'Range Selection' }
];

export const DisplayStyleOptions = [
  { value: DisplayStyle.DROPDOWN, label: 'Dropdown' },
  { value: DisplayStyle.RADIO, label: 'Radio Buttons' },
  { value: DisplayStyle.CHECKBOX, label: 'Checkboxes' },
  { value: DisplayStyle.SLIDER, label: 'Slider' }
];

export interface MenuOptionChoice {
  id?: number;
  choiceName: string;
  description?: string;
  additionalPrice: number;
  default?: boolean;
  active: boolean;
  imagePath?: string;
}

export interface MenuOption {
  id?: number;
  name: string;
  optionName?: string;
  description?: string;
  required: boolean;
  active: boolean;
  selectionType: SelectionType;
  displayStyle: DisplayStyle;
  minSelect?: number;
  maxSelect?: number;
  choices: MenuOptionChoice[];
  defaultValue?: string | string[];
  position?: number;
  categories?: Category[];
  createdAt?: string;
  updatedAt?: string;
  imagePath?: string;
}