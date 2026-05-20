import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureAdmin } from './feature-admin';

describe('FeatureAdmin', () => {
  let component: FeatureAdmin;
  let fixture: ComponentFixture<FeatureAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
