import { Component } from '@angular/core';
import { PkTreeviewModule, type TreeNode } from 'ngx-pk-ui';

@Component({
  selector: 'app-reports',
  imports: [
    PkTreeviewModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports {
  lists: TreeNode[] = [
    {
      label: 'รายงาน',
      children: [
        {
          label: 'รายงาน CMI โรงพยาบาล',
          routerLink: '/reports/cmi-hospital'
        }
      ]
    }
  ];

  onSelected(selectedNodes: TreeNode[]): void {
    console.log('Selected nodes:', selectedNodes);
  }
}
