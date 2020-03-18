import { Injectable, Injector, ComponentFactoryResolver } from '@angular/core';
import { SheetModalStackService } from './sheet-modal-stack.service';
import { SheetModalRef } from './sheet-modal-ref';
import { SheetModalConfig, SheetModalOptions } from './sheet-modal-config';

/**
 * A service for opening sheet modal windows.
 *
 * Creating a modal is straightforward: create a component or a template and pass it as an argument to
 * the `.open()` method.
 */
@Injectable({ providedIn: 'root' })
export class SheetModalService {

    constructor(
        private _moduleCFR: ComponentFactoryResolver,
        private _injector: Injector,
        private _modalStack: SheetModalStackService,
        private _config: SheetModalConfig
    ) { }

    /**
     * Opens a new modal window with the specified content and supplied options.
     *
     * Content can be provided as a `TemplateRef` or a component type. If you pass a component type as content,
     * then instances of those components can be injected with an instance of the `ActiveSheetModal` class. You can then
     * use `ActiveSheetModal` methods to close / dismiss modals from "inside" of your component.
     *
     * Also see the [`SheetModalOptions`](#/components/modal/api#SheetModalOptions) for the list of supported options.
     */
    open(content: any, options: SheetModalOptions = {}): SheetModalRef {
        const combinedOptions = Object.assign({}, this._config, options);
        return this._modalStack.open(this._moduleCFR, this._injector, content, combinedOptions);
    }

    /**
     * Dismisses all currently displayed modal windows with the supplied reason.
     *
     * @since 3.1.0
     */
    dismissAll(reason?: any) { this._modalStack.dismissAll(reason); }

    /**
     * Indicates if there are currently any open modal windows in the application.
     *
     * @since 3.3.0
     */
    hasOpenModals(): boolean { return this._modalStack.hasOpenModals(); }
}
