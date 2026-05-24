import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataAccessProgress } from './data-access-progress';

describe('DataAccessProgress', () => {
  let component: DataAccessProgress;
  let fixture: ComponentFixture<DataAccessProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataAccessProgress);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
