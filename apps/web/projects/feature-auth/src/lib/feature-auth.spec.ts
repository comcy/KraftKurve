import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureAuth } from './feature-auth';

describe('FeatureAuth', () => {
  let component: FeatureAuth;
  let fixture: ComponentFixture<FeatureAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureAuth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureAuth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
