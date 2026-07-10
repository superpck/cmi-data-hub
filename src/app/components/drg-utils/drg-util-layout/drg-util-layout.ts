import { ChangeDetectionStrategy, Component, effect, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PkIcon, PkSidenav, PkTooltip, type PkSidenavGroup, type PkSidenavItem, type PkSidenavTheme } from 'ngx-pk-ui';
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
  sidenavTheme = signal<PkSidenavTheme>((localStorage.getItem('sidenavTheme') as PkSidenavTheme) || 'peacock-blue');

  // Theme options
  readonly themeOptions: { value: PkSidenavTheme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'primary', label: 'Primary' },
    { value: 'orange', label: 'Orange' },
    { value: 'blue', label: 'Blue' },
    { value: 'teal', label: 'Teal' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'terra-cotta', label: 'Terra Cotta' },
    { value: 'air-force-blue', label: 'Air Force Blue' },
    { value: 'peacock-blue', label: 'Peacock Blue' }
  ];

  constructor() {
    // Auto-save theme to localStorage when changed
    effect(() => {
      const theme = this.sidenavTheme();
      localStorage.setItem('sidenavTheme', theme);
    });
  }

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
      collapsed: false,
      items: [
        { key: 'upload', label: 'Upload CSV', icon: 'upload_file', route: '/drg-util/upload' },
        { key: 'drg-seeker', label: 'DRG Seeker', icon: 'search_insights', route: '/drg-util/drg-seeker' },
        { key: 'รายงาน', label: 'DRG Report', icon: 'analytics', href: 'https://cmi.moph.go.th/report/default/sumall' },
        { key: 'utility', label: 'DRG Utility', icon: 'troubleshoot', href: 'https://cmi.moph.go.th/util/default/download' }
      ],
    },
    {
      heading: 'Settings',
      collapsible: true,
      collapsed: true,
      items: [
        { key: 'ทีม', label: 'ทีมพัฒนาระบบ', icon: 'group', href: 'https://cmi.moph.go.th/site/about' },
        { key: 'about', label: 'เกี่ยวกับระบบ', icon: 'info', route: '/drg-util/about' },
        { key: 'logout', label: 'Logout', icon: 'logout', fn: () => this.logout() },
      ],
    },
  ]);

  betaMenu = {
    cmi: [
      { key: 'data-list', label: 'ทะเบียน IPD', icon: 'table', route: '/drg-util/data-list' },
      { key: 'reports', label: 'รายงาน', icon: 'bar_chart', route: '/reports' },
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
        groups[1].items = [...this.betaMenu.cmi, ...groups[1].items];
        groups[0].items = [...groups[0].items, ...this.betaMenu.ai];
        return [...groups];
      });
    }
  }

  onItemClick(item: PkSidenavItem) { this.activeKey.set(item.key); }

  changeTheme(theme: PkSidenavTheme): void {
    this.sidenavTheme.set(theme);
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

}