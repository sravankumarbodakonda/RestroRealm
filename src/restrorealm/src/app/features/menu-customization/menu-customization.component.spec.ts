import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCustomizationComponent } from './menu-customization.component';

describe('MenuCustomizationComponent', () => {
  let component: MenuCustomizationComponent;
  let fixture: ComponentFixture<MenuCustomizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCustomizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuCustomizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
