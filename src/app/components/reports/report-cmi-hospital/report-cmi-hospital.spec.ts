import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportCmiHospital } from './report-cmi-hospital';

describe('ReportCmiHospital', () => {
  let component: ReportCmiHospital;
  let fixture: ComponentFixture<ReportCmiHospital>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportCmiHospital]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportCmiHospital);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
