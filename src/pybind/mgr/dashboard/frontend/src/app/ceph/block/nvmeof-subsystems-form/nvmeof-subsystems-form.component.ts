import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ActionLabelsI18n, URLVerbs } from '~/app/shared/constants/app.constants';
import { CdFormGroup } from '~/app/shared/forms/cd-form-group';
import { CdValidators } from '~/app/shared/forms/cd-validators';
import { Permission } from '~/app/shared/models/permissions';
import { AuthStorageService } from '~/app/shared/services/auth-storage.service';
import { TaskWrapperService } from '~/app/shared/services/task-wrapper.service';
import { FinishedTask } from '~/app/shared/models/finished-task';
import { Router } from '@angular/router';
import { NvmeofService } from '~/app/shared/api/nvmeof.service';

@Component({
  selector: 'cd-nvmeof-subsystems-form',
  templateUrl: './nvmeof-subsystems-form.component.html',
  styleUrls: ['./nvmeof-subsystems-form.component.scss']
})
export class NvmeofSubsystemsFormComponent implements OnInit {
  permission: Permission;
  subsystemForm: CdFormGroup;

  action: string;
  resource: string;
  pageURL: string;

  NQN_REGEX = /^nqn\.(19|20)\d\d-(0[1-9]|1[0-2])\.\D{2,3}(\.[A-Za-z0-9-]+)+(:[A-Za-z0-9-\.]+)$/;

  constructor(
    private authStorageService: AuthStorageService,
    public actionLabels: ActionLabelsI18n,
    public activeModal: NgbActiveModal,
    private nvmeofService: NvmeofService,
    private taskWrapperService: TaskWrapperService,
    private router: Router
  ) {
    this.permission = this.authStorageService.getPermissions().nvmeof;
    this.resource = $localize`Subsystem`;
    this.pageURL = 'block/nvmeof/subsystems';
  }

  ngOnInit() {
    this.createForm();
    this.action = this.actionLabels.CREATE;
  }

  createForm() {
    this.subsystemForm = new CdFormGroup({
      nqn: new UntypedFormControl('nqn.2001-07.com.ceph:' + Date.now(), {
        validators: [
          Validators.required,
          Validators.pattern(this.NQN_REGEX),
          CdValidators.custom(
            'maxLength',
            (nqnInput: string) => new TextEncoder().encode(nqnInput).length > 223
          )
        ],
        asyncValidators: [
          CdValidators.unique(this.nvmeofService.isSubsystemPresent, this.nvmeofService)
        ]
      }),
      max_namespaces: new UntypedFormControl(256, {
        validators: [CdValidators.number(false), Validators.max(256), Validators.min(1)]
      })
    });
  }

  onSubmit() {
    const component = this;
    const nqn: string = this.subsystemForm.getValue('nqn');
    let max_namespaces: number = Number(this.subsystemForm.getValue('max_namespaces'));

    const request = {
      nqn,
      max_namespaces,
      enable_ha: true
    };

    if (!max_namespaces) {
      delete request.max_namespaces;
    }

    let taskUrl = `nvmeof/subsystem/${URLVerbs.CREATE}`;

    this.taskWrapperService
      .wrapTaskAroundCall({
        task: new FinishedTask(taskUrl, {
          nqn: nqn
        }),
        call: this.nvmeofService.createSubsystem(request)
      })
      .subscribe({
        error() {
          component.subsystemForm.setErrors({ cdSubmitButton: true });
        },
        complete: () => {
          this.router.navigate([this.pageURL, { outlets: { modal: null } }]);
        }
      });
  }
}
