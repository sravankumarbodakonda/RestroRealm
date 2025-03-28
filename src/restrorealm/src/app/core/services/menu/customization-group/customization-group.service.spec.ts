import { TestBed } from '@angular/core/testing';

import { CustomizationGroupService } from './customization-group.service';

describe('CustomizationGroupService', () => {
  let service: CustomizationGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomizationGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
