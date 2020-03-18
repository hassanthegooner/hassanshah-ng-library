import { Injectable, Injector } from '@angular/core';

/**
 * Options available when opening new sheet modals with `SheetModal.open()` method.
 */
export interface SheetModalOptions {
    /**
     * `aria-labelledby` attribute value to set on the modal.
     *
     * @since 2.2.0
     */
    ariaLabelledBy?: string;

    /**
     * If `true`, the backdrop element will be created for a given modal.
     *
     * Alternatively, specify `'static'` for a backdrop which doesn't close the modal on click.
     *
     * Default value is `true`.
     */
    backdrop?: boolean;

    /**
     * Callback right before the modal will be dismissed.
     *
     * If this function returns:
     * * `false`
     * * a promise resolved with `false`
     * * a promise that is rejected
     *
     * then the modal won't be dismissed.
     */
    beforeDismiss?: () => boolean | Promise<boolean>;

    /**
      * If true, a bounce animation when modal is expanded to top.
      *
      * Default value is true
      */
    bounceAnimation?: boolean;

    /**
     * A selector specifying the element all new modals should be appended to.
     *
     * If not specified, will be `body`.
     */
    container?: string;

    /**
     * The `Injector` to use for modal content.
     */
    injector?: Injector;

    /**
     * If `true`, the modal will be closed when `Escape` key is pressed
     *
     * Default value is `true`.
     */
    keyboard?: boolean;

    /**
     * Scrollable modal content (false by default).
     *
     * @since 5.0.0
     */
    scrollable?: boolean;

    /**
     * A custom class to append to the modal.
     */
    sheetModalClass?: string;

    /**
     * If true, a border will show when extra content is scrolled down
     *
     * Default value is `true`
     */
    showBorderOnScroll?: boolean;

    /**
     * A custom class to append to the modal backdrop.
     *
     * @since 1.1.0
     */
    backdropClass?: string;
}

/**
 * A configuration service for the [`SheetModal`](#/components/modal/api#SheetModal) service.
 *
 * You can inject this service, typically in your root component, and customize the values of its properties in
 * order to provide default values for all modals used in the application.
*
* @since 3.1.0
*/
@Injectable({ providedIn: 'root' })
export class SheetModalConfig implements SheetModalOptions {
    backdrop = true;
    bounceAnimation = true;
    keyboard = true;
    showBorderOnScroll = true;
}
