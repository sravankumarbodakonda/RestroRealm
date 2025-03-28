import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizationGroupComponent } from './customization-group.component';

describe('CustomizationGroupComponent', () => {
  let component: CustomizationGroupComponent;
  let fixture: ComponentFixture<CustomizationGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizationGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizationGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
