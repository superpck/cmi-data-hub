import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiRequest } from './api-request';

describe('ApiRequest', () => {
  let component: ApiRequest;
  let fixture: ComponentFixture<ApiRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
