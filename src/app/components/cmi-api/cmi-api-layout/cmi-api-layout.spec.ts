import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmiApiLayout } from './cmi-api-layout';

describe('CmiApiLayout', () => {
  let component: CmiApiLayout;
  let fixture: ComponentFixture<CmiApiLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmiApiLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmiApiLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
