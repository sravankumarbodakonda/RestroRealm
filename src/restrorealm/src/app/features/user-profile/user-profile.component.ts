import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user/user.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FontAwesomeModule],
  standalone: true,
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  selectedFile: File | null = null;
  uploading = false;
  imageUrl =  environment.imageUrl;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe(
      (data) => (this.user = data),
      (error) => console.error('Error fetching user', error)
    );
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.user.profileImageUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  async uploadProfileImage() {
    if (!this.selectedFile) return;
    const newFileName = this.selectedFile.name.replaceAll(" ", "");
    this.selectedFile = new File([this.selectedFile], newFileName, { type: this.selectedFile.type });    
    this.uploading = true;
    try {
      const result = await this.userService.uploadProfileImage(this.selectedFile).toPromise();
      this.user.profileImageUrl = result?.profileImageUrl;
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      this.uploading = false;
      this.selectedFile = null;
    }
  }

  saveChanges(): void {
    this.userService.updateCurrentUser({ name: this.user.name, email: this.user.email }).subscribe(
      (updatedUser) => {
        this.user = updatedUser;
        alert('Profile updated successfully!');
      },
      (error) => console.error('Error updating profile', error)
    );
  }
}
