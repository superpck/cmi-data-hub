import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IpdAiSummary } from './ipd-ai-summary';

describe('IpdAiSummary', () => {
  let component: IpdAiSummary;
  let fixture: ComponentFixture<IpdAiSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IpdAiSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IpdAiSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
