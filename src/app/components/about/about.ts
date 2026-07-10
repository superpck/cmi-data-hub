import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PkIcon } from 'ngx-pk-ui';
import config from '../../configs/config';
import { VERSION } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [PkIcon],
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
  appConfig = config;
  version = VERSION.full;
}
