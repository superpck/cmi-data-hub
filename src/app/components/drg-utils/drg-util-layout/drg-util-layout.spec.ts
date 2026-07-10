import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrgUtilLayout } from './drg-util-layout';

describe('DrgUtilLayout', () => {
  let component: DrgUtilLayout;
  let fixture: ComponentFixture<DrgUtilLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrgUtilLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrgUtilLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
