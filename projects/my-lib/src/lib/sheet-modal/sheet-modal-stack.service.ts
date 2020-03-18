import { DOCUMENT } from '@angular/common';
import {
    ApplicationRef,
    ComponentFactoryResolver,
    ComponentRef,
    Inject,
    Injectable,
    Injector,
    TemplateRef,
} from '@angular/core';
import { Subject } from 'rxjs';

import { ContentRef } from './popup';
import { ActiveSheetModal, SheetModalRef } from './sheet-modal-ref';
import { SheetModalComponent } from './sheet-modal.component';

@Injectable({ providedIn: 'root' })
export class SheetModalStackService {

    private _activeSheetModalCmptHasChanged = new Subject();
    private _ariaHiddenValues: Map<Element, string> = new Map();
    private _backdropAttributes = ['backdropClass'];
    private _modalRefs: SheetModalRef[] = [];
    private _sheetModalAttributes =
        ['ariaLabelledBy', 'backdrop', 'keyboard', 'sheetModalClass'];
    private _sheetModalCmpts: ComponentRef<SheetModalComponent>[] = [];

    constructor(
        private _applicationRef: ApplicationRef, private _injector: Injector, @Inject(DOCUMENT) private _document: any) {
        // Trap focus on active sheetModalCmpt
        this._activeSheetModalCmptHasChanged.subscribe(() => {
            if (this._sheetModalCmpts.length) {
                const activeSheetModalCmpt = this._sheetModalCmpts[this._sheetModalCmpts.length - 1];
                // ngbFocusTrap(activeSheetModalCmpt.location.nativeElement, this._activeSheetModalCmptHasChanged);
                this._revertAriaHidden();
                this._setAriaHidden(activeSheetModalCmpt.location.nativeElement);
            }
        });
    }

    open(moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any, options): SheetModalRef {
        const containerEl = this._document.body;

        if (!containerEl) {
            throw new Error(`The specified modal container "${options.container || 'body'}" was not found in the DOM.`);
        }

        const activeModal = new ActiveSheetModal();
        const contentRef =
            this._getContentRef(moduleCFR, options.injector || contentInjector, content, activeModal);

        const sheetModalCmptRef: ComponentRef<SheetModalComponent> = this._attachSheetModalComponent(moduleCFR, containerEl, contentRef);
        const sheetModalRef: SheetModalRef = new SheetModalRef(sheetModalCmptRef, contentRef);

        this._registerModalRef(sheetModalRef);
        this._registerSheetModalCmpt(sheetModalCmptRef);

        activeModal.close = (result: any) => { sheetModalRef.close(result); };
        activeModal.dismiss = (reason: any) => { sheetModalRef.dismiss(reason); };

        this._applySheetModalOptions(sheetModalCmptRef.instance, options);

        return sheetModalRef;
    }

    dismissAll(reason?: any) { this._modalRefs.forEach(sheetModalRef => sheetModalRef.dismiss(reason)); }

    hasOpenModals(): boolean { return this._modalRefs.length > 0; }

    private _attachSheetModalComponent(moduleCFR: ComponentFactoryResolver, containerEl: any, contentRef: any):
        ComponentRef<SheetModalComponent> {
        const sheetModalFactory = moduleCFR.resolveComponentFactory(SheetModalComponent);
        const sheetModalCmptRef = sheetModalFactory.create(this._injector, contentRef.nodes);
        this._applicationRef.attachView(sheetModalCmptRef.hostView);
        containerEl.appendChild(sheetModalCmptRef.location.nativeElement);
        return sheetModalCmptRef;
    }

    private _applySheetModalOptions(sheetModalInstance: SheetModalComponent, options: Object): void {
        this._sheetModalAttributes.forEach((optionName: string) => {
            if (options[optionName] !== undefined || options[optionName] !== null) {
                sheetModalInstance[optionName] = options[optionName];
            }
        });
    }

    private _getContentRef(
        moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any, activeModal: ActiveSheetModal): ContentRef {
        if (!content) {
            return new ContentRef([]);
        } else if (content instanceof TemplateRef) {
            return this._createFromTemplateRef(content, activeModal);
        } else if (typeof content === 'string') {
            return this._createFromString(content);
        } else {
            return this._createFromComponent(moduleCFR, contentInjector, content, activeModal);
        }
    }

    private _createFromTemplateRef(content: TemplateRef<any>, activeModal: ActiveSheetModal): ContentRef {
        const context = {
            $implicit: activeModal,
            close(result) { activeModal.close(result); },
            dismiss(reason) { activeModal.dismiss(reason); }
        };
        const viewRef = content.createEmbeddedView(context);
        this._applicationRef.attachView(viewRef);
        return new ContentRef([viewRef.rootNodes], viewRef);
    }

    private _createFromString(content: string): ContentRef {
        const component = this._document.createTextNode(`${content}`);
        return new ContentRef([[component]]);
    }

    private _createFromComponent(
        moduleCFR: ComponentFactoryResolver, contentInjector: Injector, content: any, context: ActiveSheetModal): ContentRef {
        const contentCmptFactory = moduleCFR.resolveComponentFactory(content);
        const modalContentInjector =
            Injector.create({ providers: [{ provide: ActiveSheetModal, useValue: context }], parent: contentInjector });
        const componentRef = contentCmptFactory.create(modalContentInjector);
        const componentNativeEl = componentRef.location.nativeElement;
        this._applicationRef.attachView(componentRef.hostView);
        // FIXME: we should here get rid of the component nativeElement
        // and use `[Array.from(componentNativeEl.childNodes)]` instead and remove the above CSS class.
        return new ContentRef([[componentNativeEl]], componentRef.hostView, componentRef);
    }

    private _setAriaHidden(element: Element) {
        const parent = element.parentElement;
        if (parent && element !== this._document.body) {
            Array.from(parent.children).forEach(sibling => {
                if (sibling !== element && sibling.nodeName !== 'SCRIPT') {
                    this._ariaHiddenValues.set(sibling, sibling.getAttribute('aria-hidden'));
                    sibling.setAttribute('aria-hidden', 'true');
                }
            });

            this._setAriaHidden(parent);
        }
    }

    private _revertAriaHidden() {
        this._ariaHiddenValues.forEach((value, element) => {
            if (value) {
                element.setAttribute('aria-hidden', value);
            } else {
                element.removeAttribute('aria-hidden');
            }
        });
        this._ariaHiddenValues.clear();
    }

    private _registerModalRef(sheetModalRef: SheetModalRef) {
        const unregisterModalRef = () => {
            const index = this._modalRefs.indexOf(sheetModalRef);
            if (index > -1) {
                this._modalRefs.splice(index, 1);
            }
        };
        this._modalRefs.push(sheetModalRef);
        sheetModalRef.result.then(unregisterModalRef, unregisterModalRef);
    }

    private _registerSheetModalCmpt(sheetModalCmpt: ComponentRef<SheetModalComponent>) {
        this._sheetModalCmpts.push(sheetModalCmpt);
        this._activeSheetModalCmptHasChanged.next();

        sheetModalCmpt.onDestroy(() => {
            const index = this._sheetModalCmpts.indexOf(sheetModalCmpt);
            if (index > -1) {
                this._sheetModalCmpts.splice(index, 1);
                this._activeSheetModalCmptHasChanged.next();
            }
        });
    }

}
