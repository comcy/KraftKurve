import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataAccessAdmin } from './data-access-admin';

describe('DataAccessAdmin', () => {
  let component: DataAccessAdmin;
  let fixture: ComponentFixture<DataAccessAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataAccessAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
