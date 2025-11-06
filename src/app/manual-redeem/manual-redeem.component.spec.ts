import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualRedeemComponent } from './manual-redeem.component';

describe('ManualRedeemComponent', () => {
  let component: ManualRedeemComponent;
  let fixture: ComponentFixture<ManualRedeemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualRedeemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualRedeemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
