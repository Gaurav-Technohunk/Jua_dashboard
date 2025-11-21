import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationEditModalComponent } from './organization-edit-modal.component';

describe('OrganizationEditModalComponent', () => {
  let component: OrganizationEditModalComponent;
  let fixture: ComponentFixture<OrganizationEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrganizationEditModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

