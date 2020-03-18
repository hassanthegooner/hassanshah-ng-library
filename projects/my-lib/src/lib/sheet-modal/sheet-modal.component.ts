import { AfterViewInit, Component, Input, ElementRef, EventEmitter, Inject, OnInit, Output, Renderer2, ViewChild  } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'hs-sheet-modal',
  templateUrl: './sheet-modal.component.html',
  styleUrls: ['./sheet-modal.component.scss']
})
export class SheetModalComponent implements OnInit, AfterViewInit {

  @ViewChild('sheetModal', { static: false }) sheetModalEl: ElementRef;

  @Input() initialTranslate = -48;
  @Input() showBorderOnScoll = true;
  @Input() bounceAnimation = true;
  @Input() backdrop = true;
  @Input() sheetModalClass: string;

  @Output() expanded = new EventEmitter();
  @Output() shrunk = new EventEmitter();

  isTouched = false;
  startTouch;
  currentTouch;
  isScrolling;
  touchStartTime;
  touchesDiff;
  isMoved = false;
  isTopSheetModal;
  swipeStepTranslate;
  startTranslate;
  currentTranslate = -60;
  sheetElOffsetHeight;
  minTranslate = -60;
  maxTranslate;
  overrideContentScroll = false;

  _minTranslate = -60;

  backdropStyle = {
    visibility: 'visible',
    display: 'block',
    opacity: 0
  };

  extraContentScrollSubscription: Subscription;

  isExpandingToTop = false;

  constructor(
    @Inject(DOCUMENT) private document: any,
    private el: ElementRef,
    private renderer: Renderer2,
  ) { }

  ngOnInit() { }

  ngAfterViewInit() {
    const swipeStepEl = this.getSwipeStepElement();
    const initialTranslate = Math.min(-(swipeStepEl.clientHeight || swipeStepEl.offsetHeight), this._minTranslate);
    this._minTranslate = initialTranslate;
    this.minTranslate = initialTranslate;
    this.currentTranslate = initialTranslate;
    this.setTranslateY(initialTranslate);
    if (this.showBorderOnScoll) {
      this.setScrollListener();
    }
  }

  onTouchStart(e) {
    this.isTouched = true;
    this.isMoved = false;
    this.startTouch = {
      x: e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX,
      y: e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY,
    };
    this.touchStartTime = Date.now();
    this.isScrolling = undefined;
    this.overrideContentScroll = false;
    this.setOverrideContentScroll(e);
  }

  onTouchMove(e) {
    if (!this.isTouched) { return; }
    this.currentTouch = {
      x: e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX,
      y: e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY,
    };
    if (typeof this.isScrolling === 'undefined') {
      this.isScrolling = !!(this.isScrolling ||
        Math.abs(this.currentTouch.x - this.startTouch.x) > Math.abs(this.currentTouch.y - this.startTouch.y));
    }
    if (this.isScrolling) {
      this.isTouched = false;
      this.isMoved = false;
      return;
    }

    this.touchesDiff = this.startTouch.y - this.currentTouch.y;
    const direction = this.touchesDiff < 0 ? 'to-bottom' : 'to-top';
    /**
     * Allow scrolling of extra content when sheet is expanded
     */
    if (this.isSheetExpanded() && direction === 'to-top') {
      return;
    }
    const extraContent = this.getExtraContentElement();
    if (this.isSheetExpanded() && direction === 'to-bottom' && !this.overrideContentScroll && extraContent && extraContent.scrollTop > 0) {
      return;
    }
    if (!this.isMoved) {
      this.sheetElOffsetHeight = this.sheetModalEl.nativeElement.offsetHeight;
      this.startTranslate = this.getTranslateY();
      // if (this.isTopSheetModal) {
      //   this.minTranslate = sheet.params.swipeToClose ? -this.sheetElOffsetHeight : -this.swipeStepTranslate;
      //   this.maxTranslate = 0;
      // } else {
      this.minTranslate = this._minTranslate;
      this.maxTranslate = -Math.min(this.sheetElOffsetHeight);
      // }
      this.isMoved = true;
    }
    this.currentTranslate = this.startTranslate - this.touchesDiff;
    this.currentTranslate = Math.max(Math.min(this.currentTranslate, this.minTranslate), this.maxTranslate);
    e.preventDefault();
    this.setTransition(0);
    this.setTranslateY(this.currentTranslate + 'px');
    this.lockDocumentBodyScroll();
    this.setBackdropOpacity(
      (Math.abs(this.currentTranslate) - Math.abs(this.minTranslate)) / (Math.abs(this.maxTranslate) - Math.abs(this.minTranslate)));
  }

  onTouchEnd(e) {
    this.isTouched = false;
    if (!this.isMoved) {
      return;
    }
    this.isMoved = false;
    const direction = this.touchesDiff < 0 ? 'to-bottom' : 'to-top';
    const diff = Math.abs(this.touchesDiff);
    if (diff === 0 || this.currentTranslate === this.startTranslate) { return; }

    const timeDiff = (new Date()).getTime() - this.touchStartTime;

    const openDirection = 'to-top';
    const closeDirection = 'to-bottom';
    /**
     * If swiped quickly
     */
    if (timeDiff < 300 && diff > 10) {
      if (direction === openDirection) {
        this.expandToTop();
      }
      if (direction === closeDirection) {
        this.shrink();
        this.unlockDocumentBodyScroll();
      }
      return;
    }
    /**
     * If dragging slowly
     */
    if (timeDiff >= 300) {
      const expandPoint = -Math.round(this.sheetElOffsetHeight * 0.33);
      if (this.currentTranslate <= expandPoint) {
        this.expandToTop();
      } else {
        this.shrink();
        this.unlockDocumentBodyScroll();
      }
    }
  }

  isSheetExpanded() {
    return this.currentTranslate === this.maxTranslate;
  }

  isSheetShrunk() {
    return !this.isTouched && this.currentTranslate === this.minTranslate;
  }

  expandToTop() {
    this.setTransition(0.2);
    this.currentTranslate = this.maxTranslate;
    if (this.bounceAnimation) {
      this.isExpandingToTop = true;
      this.renderer.addClass(this.sheetModalEl.nativeElement, 'is-expanding');
      const translateBounceTop = this.maxTranslate - 16;
      this.setTranslateY(translateBounceTop);
      setTimeout(() => {
        this.setTranslateY(this.maxTranslate + 'px');
        setTimeout(() => {
          this.renderer.removeClass(this.sheetModalEl.nativeElement, 'is-expanding');
          this.isExpandingToTop = false;
        }, 200);
      }, 200);
    } else {
      this.setTranslateY(this.maxTranslate + 'px');
    }
    this.setBackdropOpacity(1);
    this.expanded.emit();
  }

  shrink() {
    this.setTransition(0.2);
    this.currentTranslate = this.minTranslate;
    this.setTranslateY(this.minTranslate + 'px');
    this.setBackdropOpacity(0.02);
    this.setBackdropOpacity(0);
    this.shrunk.emit();
  }

  getTranslateY() {
    const transform: string = this.sheetModalEl.nativeElement.style.transform;
    const y = transform.trim().split(',')[1].replace('px', '');
    return y;
  }

  setTranslateY(y) {
    if (typeof y === 'number') {
      y = y + 'px';
    }
    this.renderer.setStyle(this.sheetModalEl.nativeElement, 'transform', `translate3d(0, ${y}, 0)`);
  }

  setTransition(value: number) {
    this.renderer.setStyle(this.sheetModalEl.nativeElement, 'transition-duration', value + 's');
  }

  lockDocumentBodyScroll() {
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
  }

  unlockDocumentBodyScroll() {
    this.renderer.removeStyle(this.document.body, 'overflow');
  }

  private setOverrideContentScroll(e) {
    if (e.target && e.target.className === 'swipe-handler') {
      this.overrideContentScroll = true;
    } else {
      const swipeStepEl = this.getSwipeStepElement();
      if (swipeStepEl.contains(e.target)) {
        this.overrideContentScroll = true;
      }
    }
  }

  private setScrollListener() {
    const extraContentEl = this.getExtraContentElement();
    const swipeStepEl = this.getSwipeStepElement();
    this.extraContentScrollSubscription = fromEvent(extraContentEl, 'scroll').subscribe(() => {
      if (extraContentEl.scrollTop > 16) {
        this.renderer.addClass(swipeStepEl, 'show-border-bottom');
      } else {
        this.renderer.removeClass(swipeStepEl, 'show-border-bottom');
      }
    });
  }

  private getSwipeStepElement() {
    return (Array.from(this.sheetModalEl.nativeElement.childNodes[0].children))
      .find(el => el['className'].indexOf('sheet-modal-swipe-step') > -1) as HTMLElement;
  }

  private getExtraContentElement() {
    return (Array.from(this.sheetModalEl.nativeElement.childNodes[0].children))
      .find(el => el['className'].indexOf('sheet-modal-extra-content') > -1) as HTMLElement;
  }

  private setBackdropOpacity(opacity: number) {
    this.backdropStyle.opacity = opacity;
  }

}
