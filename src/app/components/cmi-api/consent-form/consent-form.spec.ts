import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsentForm } from './consent-form';

describe('ConsentForm', () => {
  let component: ConsentForm;
  let fixture: ComponentFixture<ConsentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsentForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
