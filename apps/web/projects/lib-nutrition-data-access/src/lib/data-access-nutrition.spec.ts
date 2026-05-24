import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataAccessNutrition } from './data-access-nutrition';

describe('DataAccessNutrition', () => {
  let component: DataAccessNutrition;
  let fixture: ComponentFixture<DataAccessNutrition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessNutrition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataAccessNutrition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
