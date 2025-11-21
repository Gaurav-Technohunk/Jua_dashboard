import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationDeleteModalComponent } from './organization-delete-modal.component';

describe('OrganizationDeleteModalComponent', () => {
  let component: OrganizationDeleteModalComponent;
  let fixture: ComponentFixture<OrganizationDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrganizationDeleteModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

