import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrgSeekerComponent } from './drg-seeker.component';

describe('DrgSeekerComponent', () => {
  let component: DrgSeekerComponent;
  let fixture: ComponentFixture<DrgSeekerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DrgSeekerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrgSeekerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
