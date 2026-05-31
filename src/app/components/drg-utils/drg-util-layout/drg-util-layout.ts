import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PkIcon, PkSidenav, PkTooltip, type PkSidenavGroup, type PkSidenavItem } from 'ngx-pk-ui';
import { MainService } from '../../../services/main.service';
import { CommonModule } from '@angular/common';
import CONFIG from '../../../configs/config';

@Component({
  selector: 'app-drg-util-layout',
  imports: [
    CommonModule,
    RouterOutlet, PkSidenav,
    PkIcon, PkTooltip
  ],
  templateUrl: './drg-util-layout.html',
  styleUrls: ['./drg-util-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrgUtilLayout implements OnInit {
  private mainService = inject(MainService);
  private router = inject(Router);
  loading = signal(false);

  isBeta = window.location.hostname === 'localhost' || window.location.href.includes('beta');

  config = signal(CONFIG);
  userInfo: any = signal({});

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  activeKey = signal('drg-seeker');

  navGroups = signal<PkSidenavGroup[]>([
    {
      heading: 'CMI Data Hub',
      collapsible: true,
      collapsed: false,
      items: [
        { key: 'website', label: 'หน้าหลัก CMI', icon: 'home', href: 'https://cmi.moph.go.th' },
        { key: 'download', label: 'Download ข้อมูล', icon: 'csv', route: '/cmi-api/download' },
      ],
    },
    {
      heading: 'CMI Data',
      collapsible: true,
      collapsed: true,
      items: [
        { key: 'รายงาน', label: 'DRG Report', icon: 'analytics', href: 'https://cmi.moph.go.th/report/default/sumall' },
        { key: 'utility', label: 'DRG Utility', icon: 'troubleshoot', href: 'https://cmi.moph.go.th/util/default/download' },
        { key: 'drg-seeker', label: 'DRG Seeker', icon: 'search_insights', route: '/drg-util/drg-seeker' },
      ],
    },
    {
      heading: 'Settings',
      collapsible: true,
      collapsed: true,
      items: [
        { key: 'about', label: 'เกี่ยวกับระบบ', icon: 'info', route: '/drg-util/about' },
        { key: 'logout', label: 'Logout', icon: 'logout', fn: () => this.logout() },
      ],
    },
  ]);

  betaMenu = {
    cmi: [
      { key: 'data-list', label: 'ทะเบียน IPD', icon: 'table', route: '/drg-util/data-list' },
      { key: 'upload', label: 'Upload CSV', icon: 'upload_file', route: '/drg-util/upload' }
    ],
    ai: [
      { key: 'ipd-summary', label: 'D/C Summary', icon: 'flowsheet', route: '/ai-tools/ipd-summary' },
      { key: 'on-demand-prompt', label: 'AI Prompt', icon: 'terminal', route: '/ai-tools/drg-prompt' },
    ]
  }

  async ngOnInit(): Promise<void> {
    const info = await this.mainService.tokenDecode();
    this.userInfo.set(info ?? {});
    if (this.isBeta) {
      this.navGroups.update(groups => {
        groups[1].items.push(...this.betaMenu.cmi);
        groups[0].items.push(...this.betaMenu.ai);
        return [...groups];
      });
    }
  }

  onItemClick(item: PkSidenavItem) { this.activeKey.set(item.key); }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

}