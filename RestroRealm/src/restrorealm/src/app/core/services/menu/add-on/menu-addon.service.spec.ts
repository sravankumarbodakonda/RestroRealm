import { TestBed } from '@angular/core/testing';

import { MenuAddonService } from './menu-addon.service';

describe('MenuAddonService', () => {
  let service: MenuAddonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuAddonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
