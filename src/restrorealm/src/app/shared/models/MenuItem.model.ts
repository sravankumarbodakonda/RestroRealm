import { CustomizationGroup } from "./customization-group.model";
import { SpiceLevel } from "./menu-addon.model";

// export interface MenuItem {
//   id: number;
//   image: string;
//   name: string;
//   description: string;
//   basePrice: number;
//   calories: number;
//   unavailable?: boolean;
//   isNew?: boolean;
//   isVegetarian?: boolean;
//   isSpicy?: boolean;
//   quantity?: number;
//   customizations?: Array<{
//     name: string;
//     choices: Array<{
//       id: number;
//       name: string;
//       priceAdjustment: number;
//       selected?: boolean;
//     }>
//   }>;
//   imageUrl?: string;
//   createdAt?: any;
// }

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  calories: number;
  category?: any;
  unavailable?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  spiceLevel?: SpiceLevel;
  customizable?: boolean;
  hasAddOns?: boolean;
  imagePath?: string;
  quantity?: number;
  customizations?: Array<{
    name: string;
    choices: Array<{
      id: number;
      name: string;
      priceAdjustment: number;
      selected?: boolean;
    }>
  }>;
  customizationGroups?: CustomizationGroup[];
  customizationGroupIds?: number[];
  addOns?: number[];
  imageUrl?: string;
  createdAt?: any;
  featured?: boolean;
}