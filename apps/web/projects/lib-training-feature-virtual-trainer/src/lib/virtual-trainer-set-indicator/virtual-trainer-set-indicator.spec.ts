import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualTrainerSetIndicator } from './virtual-trainer-set-indicator';

describe('VirtualTrainerSetIndicator', () => {
  let component: VirtualTrainerSetIndicator;
  let fixture: ComponentFixture<VirtualTrainerSetIndicator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualTrainerSetIndicator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirtualTrainerSetIndicator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
