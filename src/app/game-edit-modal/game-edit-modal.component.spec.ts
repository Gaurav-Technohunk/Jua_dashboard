import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameEditModalComponent } from './game-edit-modal.component';

describe('GameEditModalComponent', () => {
  let component: GameEditModalComponent;
  let fixture: ComponentFixture<GameEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameEditModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
