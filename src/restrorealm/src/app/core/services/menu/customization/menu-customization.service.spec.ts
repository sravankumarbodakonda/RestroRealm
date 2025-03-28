import { TestBed } from '@angular/core/testing';

import { MenuCustomizationService } from './menu-customization.service';

describe('MenuCustomizationService', () => {
  let service: MenuCustomizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuCustomizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
