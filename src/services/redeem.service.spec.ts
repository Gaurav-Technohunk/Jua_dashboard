import { TestBed } from '@angular/core/testing';

import { RedeemService } from '../services/redeem.service';

describe('RedeemService', () => {
  let service: RedeemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RedeemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
