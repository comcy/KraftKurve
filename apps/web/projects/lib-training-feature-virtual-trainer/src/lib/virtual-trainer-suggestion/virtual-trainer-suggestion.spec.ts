import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualTrainerSuggestion } from './virtual-trainer-suggestion';

describe('VirtualTrainerSuggestion', () => {
  let component: VirtualTrainerSuggestion;
  let fixture: ComponentFixture<VirtualTrainerSuggestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualTrainerSuggestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirtualTrainerSuggestion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
