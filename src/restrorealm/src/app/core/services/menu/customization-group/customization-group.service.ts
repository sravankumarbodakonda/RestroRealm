import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CustomizationGroup } from '../../../../shared/models/customization-group.model';

@Injectable({
  providedIn: 'root'
})
export class CustomizationGroupService {
  private apiUrl = environment.apiUrl + '/customization-groups';

  constructor(private http: HttpClient) { }

  getCustomizationGroups(): Observable<CustomizationGroup[]> {
    return this.http.get<CustomizationGroup[]>(this.apiUrl);
  }

  getCustomizationGroup(id: number): Observable<CustomizationGroup> {
    return this.http.get<CustomizationGroup>(`${this.apiUrl}/${id}`);
  }

  createCustomizationGroup(formData: FormData): Observable<CustomizationGroup> {
    return this.http.post<CustomizationGroup>(this.apiUrl, formData);
  }

  updateCustomizationGroup(id: number, formData: FormData): Observable<CustomizationGroup> {
    return this.http.put<CustomizationGroup>(`${this.apiUrl}/${id}`, formData);
  }

  deleteCustomizationGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getGroupsByMenuItem(menuItemId: number): Observable<CustomizationGroup[]> {
    return this.http.get<CustomizationGroup[]>(`${environment.apiUrl}/menu-items/${menuItemId}/customization-groups`);
  }

  assignGroupToMenuItem(menuItemId: number, groupId: number, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/menu-items/${menuItemId}/customization-groups/${groupId}`, data);
  }

  removeGroupFromMenuItem(menuItemId: number, groupId: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/menu-items/${menuItemId}/customization-groups/${groupId}`);
  }
}
