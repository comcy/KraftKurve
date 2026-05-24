import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureNutrition } from './feature-nutrition';

describe('FeatureNutrition', () => {
  let component: FeatureNutrition;
  let fixture: ComponentFixture<FeatureNutrition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureNutrition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureNutrition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
