import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../core/services/menu/menu.service';
import { Category } from '../../shared/models/category.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-category',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  standalone: true,
})
export class CategoryPageComponent implements OnInit {
  categories: Category[] = [];
  userHasPermission: boolean = false; // Adjust this based on auth logic

  constructor(private menuService: MenuService, private router: Router) {}

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.menuService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(category => ({
          ...category,
          imageUrl: category.imageUrl || 'assets/placeholder.png' // Default image until backend supports it
        }));
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });
  }

  navigateToMenu(categoryName: string): void {
    this.router.navigate(['/menu', categoryName]); // Navigate to Menu Page with category
  }
}
