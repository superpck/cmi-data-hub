import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { PkIcon } from 'ngx-pk-ui';
import { ThemeService } from '../../services/theme.service';

//https://superpck.github.io/ngx-pk-ui/pk-icon

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, PkIcon],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  themeService = inject(ThemeService);
  private router = inject(Router);
  settingsOpen = signal(false);

  toggleSettings(): void {
    this.settingsOpen.update((v) => !v);
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
