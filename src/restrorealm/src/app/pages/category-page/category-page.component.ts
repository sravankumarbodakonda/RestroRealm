import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../core/services/menu/menu.service';
import { Category } from '../../shared/models/category.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-category',
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  standalone: true,
})
export class CategoryPageComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm: string = '';
  userHasPermission: boolean = false; 
  imageUrl = environment.imageUrl;
  currentTime = new Date();
  showAgeVerification: boolean = false;
  tempBirthDate: string = '';
  private ageVerificationResolve: ((value: boolean) => void) | null = null;
  placeholderImagePath: string = 'https://www.partstown.com/about-us/wp-content/uploads/2023/07/Most-Profitable-Restaurant-Menu-Items-Menu-Stars.jpg';
  currentCategory: Category | null = null;
  private static userVerifiedAge: boolean = false;
  private static userDateOfBirth: string | null = null;

  constructor(
    private menuService: MenuService, 
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchCategories();
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
    
    const userInfo = this.authService.getUserInfo();
    if (userInfo && userInfo.dateOfBirth) {
      CategoryPageComponent.userDateOfBirth = userInfo.dateOfBirth;
      const age = this.calculateAge(userInfo.dateOfBirth);
      if (age !== null && age >= 18) {
        CategoryPageComponent.userVerifiedAge = true;
      }
    }
  }

  fetchCategories(): void {
    this.menuService.getCategoriesNoHeaders().subscribe({
      next: (categories) => {
        this.categories = categories.map(category => ({
          ...category
        }));
        this.filteredCategories = [...this.categories];
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });
  }
  
  searchCategories(term: string): void {
    this.searchTerm = term.toLowerCase().trim();
    if (!this.searchTerm) {
      this.filteredCategories = [...this.categories];
      return;
    }
    
    this.filteredCategories = this.categories.filter(category => 
      category.name.toLowerCase().includes(this.searchTerm)
    );
  }

  getCategoryImageUrl(category: Category): string {
    return this.getImagePath(category);
  }

  isCategoryAvailable(category: Category): boolean {
    if (!category || !category.availableStartTime || !category.availableEndTime) {
      return true;
    }

    const now = this.currentTime;
    const [startHour, startMinute] = category.availableStartTime.split(':').map(Number);
    const [endHour, endMinute] = category.availableEndTime.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0);

    return now >= startTime && now <= endTime;
  }

  navigateToMenu(category: Category) {
    if (!this.isCategoryAvailable(category)) {
      return;
    }
  
    if (category.ageRestricted) {
      if (CategoryPageComponent.userVerifiedAge) {
        this.redirectToMenu(category.name);
        return;
      }
      
      const dob = this.authService.getUserInfo()?.dateOfBirth;
      const userAge = this.calculateAge(dob);

      if (userAge === null) {
        if (CategoryPageComponent.userDateOfBirth) {
          const sessionAge = this.calculateAge(CategoryPageComponent.userDateOfBirth);
          if (sessionAge !== null && sessionAge >= 18) {
            CategoryPageComponent.userVerifiedAge = true;
            this.redirectToMenu(category.name);
            return;
          } else if (sessionAge !== null) {
            alert('You must be at least 18 years old to access this category');
            return;
          }
        }
        
        this.currentCategory = category;
        this.verifyAge().then(verified => {
          if (verified && this.currentCategory) {
            this.redirectToMenu(this.currentCategory.name);
            this.currentCategory = null;
          }
        });
        return;
      }
      
      if (userAge < 18) {
        alert('You must be at least 18 years old to access this category');
        return;
      } else {
        CategoryPageComponent.userVerifiedAge = true;
      }
    }

    this.redirectToMenu(category.name);
  }

  private verifyAge(): Promise<boolean> {
    this.showAgeVerification = true;
    return new Promise((resolve) => {
      this.ageVerificationResolve = resolve;
    });
  }

  confirmAge() {
    this.showAgeVerification = false;
    if (this.tempBirthDate) {
      const birthDate = new Date(this.tempBirthDate);
      const age = this.calculateAge(birthDate);
      const isVerified = age !== null && age >= 18;
      
      if (isVerified) {
        CategoryPageComponent.userVerifiedAge = true;
        CategoryPageComponent.userDateOfBirth = this.tempBirthDate;
      }
      
      this.ageVerificationResolve?.(isVerified);
    } else {
      this.ageVerificationResolve?.(false);
    }
    this.resetAgeVerification();
  }

  cancelAgeVerification() {
    this.showAgeVerification = false;
    this.ageVerificationResolve?.(false);
    this.currentCategory = null;
    this.resetAgeVerification();
  }

  private resetAgeVerification() {
    this.tempBirthDate = '';
    this.ageVerificationResolve = null;
  }

  private calculateAge(dob: string | Date | undefined): number | null {
    if (!dob) return null;
  
    const birthDate = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
  
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || 
        (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private redirectToMenu(categoryName: string) {
    this.router.navigate(['/menu', encodeURIComponent(categoryName)]);
  }
  getImagePath(item: any): string {
    if (!item) return '';
    
    if (item.imagePath) {
        return item.imagePath.startsWith('http') 
            ? item.imagePath 
            : this.imageUrl + item.imagePath;
    }
    
    if (item.imageUrl) {
        return item.imageUrl.startsWith('http')
            ? item.imageUrl
            : this.imageUrl + item.imageUrl;
    }
    
    return '';
}
}
