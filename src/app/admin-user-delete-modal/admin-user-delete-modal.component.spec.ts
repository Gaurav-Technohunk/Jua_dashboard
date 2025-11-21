import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserDeleteModalComponent } from './admin-user-delete-modal.component';

describe('AdminUserDeleteModalComponent', () => {
  let component: AdminUserDeleteModalComponent;
  let fixture: ComponentFixture<AdminUserDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminUserDeleteModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUserDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

