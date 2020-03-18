
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SheetModalComponent } from './sheet-modal.component';
import { SheetModalService } from './sheet-modal.service';

@NgModule({
  declarations: [
    SheetModalComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    SheetModalComponent
  ],
  entryComponents: [
    SheetModalComponent
  ],
  providers: [
    SheetModalService
  ],
})
export class SheetModalModule { }
