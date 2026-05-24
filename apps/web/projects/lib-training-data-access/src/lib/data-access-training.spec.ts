import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataAccessTraining } from './data-access-training';

describe('DataAccessTraining', () => {
  let component: DataAccessTraining;
  let fixture: ComponentFixture<DataAccessTraining>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessTraining]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataAccessTraining);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
