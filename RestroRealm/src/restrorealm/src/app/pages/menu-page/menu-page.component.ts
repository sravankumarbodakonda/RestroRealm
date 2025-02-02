import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MenuService } from '../../core/services/menu/menu.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  calories: number; // Placeholder for future implementation
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  standalone: true,
})
export class MenuPageComponent implements OnInit {
  menuItems: MenuItem[] = [];
  categoryName: string = '';

  constructor(private route: ActivatedRoute, private menuService: MenuService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoryName = params.get('categoryName') || '';
      this.fetchMenuItems();
    });
  }

  fetchMenuItems(): void {
    this.menuService.getMenuItemsByCategoryName(this.categoryName).subscribe({
      next: (menuItems) => {
        this.menuItems = menuItems.map(item => ({
          ...item,
          calories: item.calories || 0 // Placeholder for now
        }));
      },
      error: (err) => {
        console.error('Error fetching menu items:', err);
      }
    });
  }

  addToCart(menuItem: MenuItem): void {
    console.log('Added to cart:', menuItem.name); // Cart logic to be implemented later
  }
}
