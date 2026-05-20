import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureTraining } from './feature-training';

describe('FeatureTraining', () => {
  let component: FeatureTraining;
  let fixture: ComponentFixture<FeatureTraining>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureTraining]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureTraining);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
