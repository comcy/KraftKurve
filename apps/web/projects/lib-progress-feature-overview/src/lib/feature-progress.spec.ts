import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureProgress } from './feature-progress';

describe('FeatureProgress', () => {
  let component: FeatureProgress;
  let fixture: ComponentFixture<FeatureProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureProgress);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
