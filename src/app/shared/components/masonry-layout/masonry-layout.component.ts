import { AfterViewInit, ChangeDetectorRef, Component, ContentChild, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, Renderer2, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
import { auditTime, fromEvent, Observable, of, Subject, throttleTime } from "rxjs";
import { WindowRefService } from "@shared/services/window-ref.service";
import { isPlatformBrowser } from "@angular/common";
import { takeUntil } from "rxjs/operators";
import { UtilsService } from "@shared/services/utils/utils.service";
import { Breakpoint } from "@shared/services/device.service";

export interface MasonryBreakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface MasonryLoadable {
  loaded: EventEmitter<void>;
}

interface MasonryItem<T> {
  data: T;
  visible: boolean;
  height?: number;
  aspectRatio?: number;
  offsetTop?: number;
}

@Component({
  selector: "astrobin-masonry-layout",
  template: `
    <div
      #container
      class="masonry-container"
      [style.--gutter]="gutter"
    >
      <div
        *ngFor="let item of itemStates; trackBy: trackByFn"
        class="masonry-item"
        [class.wide]="item.aspectRatio && item.aspectRatio > 2"
        [attr.data-masonry-id]="item.data[this.idProperty]"
        [style.height.px]="item.height || null"
        [style.--columns-xs]="breakpointColumns.xs"
        [style.--columns-sm]="breakpointColumns.sm"
        [style.--columns-md]="breakpointColumns.md"
        [style.--columns-lg]="breakpointColumns.lg"
        [style.--columns-xl]="breakpointColumns.xl"
        [style.--gutter]="gutter"
      >
        <ng-container
          *ngIf="item.visible"
          [ngTemplateOutlet]="itemTemplate"
          [ngTemplateOutletContext]="getTemplateContext(item.data)"
        >
        </ng-container>
      </div>
    </div>
  `,
  styleUrls: ["./masonry-layout.component.scss"]

})
export class MasonryLayoutComponent<T> implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() items: T[] = [];
  @Input() idProperty = "id";
  @Input() gutter = 16;

  @Output() layoutReady = new EventEmitter<void>();

  @ViewChild("container") container!: ElementRef;

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{
    $implicit: T;
    notifyReady: () => void;
  }>;

  protected breakpointColumns: Required<MasonryBreakpoints> = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 3
  };
  protected itemStates: MasonryItem<T>[] = [];
  protected MasonryModule: any;
  protected masonry: any;

  private readonly _isBrowser: boolean;
  private readonly _READY_TIMEOUT = 1000;

  private _masonryLoaded = false;
  private _pendingReadyItems = new Set<string | number>();
  private _layoutInProgress = false;
  private _readyItems = new Set<string | number>();
  private _previousItemCount = 0;
  private _currentBreakpoint?: string;
  private _readyTimeouts = new Map<string | number, any>();
  private _destroyed$ = new Subject<void>();
  private _initializationLock = false;
  private _initializationQueue: (() => void)[] = [];
  private _cachedWindowHeight: number = 0;
  private _containerTop: number = 0;
  private _scrollableParent: HTMLElement | Window;
  private _boundingRects = new Map<string, DOMRect>();
  private _SCROLL_BUFFER: number;

  constructor(
    public readonly windowRefService: WindowRefService,
    @Inject(PLATFORM_ID) public readonly platformId: Object,
    public readonly renderer: Renderer2,
    public readonly utilsService: UtilsService,
    public readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this._isBrowser = isPlatformBrowser(platformId);
  }

  @Input() set breakpoints(value: MasonryBreakpoints) {
    this.breakpointColumns = {
      xs: value.xs ?? 1,
      sm: value.sm ?? 2,
      md: value.md ?? 2,
      lg: value.lg ?? 3,
      xl: value.xl ?? 3
    };
  }

  ngOnInit() {
    if (this._isBrowser) {
      this._initializationLock = true;
      import("masonry-layout").then(module => {
        this.MasonryModule = module;
        this._masonryLoaded = true;

        // Process pending items in a controlled way
        const pendingItems = Array.from(this._pendingReadyItems);
        this._pendingReadyItems.clear();

        pendingItems.forEach(itemId => {
          this._initializationQueue.push(() => this._notifyItemReady(itemId));
        });

        this._initializationLock = false;
        this._processInitializationQueue();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.items) {
      this._handleItemsChange(changes.items);
      return;
    }

    if (this.masonry && (changes.breakpoints && !changes.breakpoints.firstChange) ||
      (changes.gutter && !changes.gutter.firstChange)) {
      this._reloadMasonry().subscribe();
    }
  }

  ngAfterViewInit() {
    if (this._isBrowser) {
      this._scrollableParent = UtilsService.getScrollableParent(this.container.nativeElement, this.windowRefService);
      this._initScrollListener();
      this._initResizeListener();
    }
  }

  ngOnDestroy() {
    this._initializationQueue = [];
    this._initializationLock = false;
    this._boundingRects.clear();
    this._cachedWindowHeight = 0;

    this._destroyMasonry();

    if (this._isBrowser) {
      this._readyTimeouts.forEach(timeout => clearTimeout(timeout));
      this._readyTimeouts.clear();
    }

    this._destroyed$.next();
    this._destroyed$.complete();
  }

  protected getTemplateContext(item: T) {
    return {
      $implicit: item,
      notifyReady: () => this._notifyItemReady(item[this.idProperty])
    };
  }

  protected trackByFn(_: number, item: MasonryItem<T>): string | number {
    return item.data[this.idProperty];
  }

  private _processInitializationQueue() {
    while (this._initializationQueue.length > 0) {
      const task = this._initializationQueue.shift();
      task?.();
    }
  }

  private _handleItemsChange(itemsChange: SimpleChanges["items"]): void {
    const currentItems = itemsChange.currentValue || [];
    const previousItems = itemsChange.previousValue || [];

    if (itemsChange.firstChange) {
      this._updateItemStates();
      return;
    }

    const isPagination = previousItems.length > 0 &&
      currentItems.length > previousItems.length &&
      previousItems.every((prevItem, index) =>
        currentItems[index][this.idProperty] === prevItem[this.idProperty]
      );

    if (isPagination || !this.masonry) {
      this._updateItemStates();
    } else {
      this._reloadMasonry().subscribe();
    }
  }

  private _getBreakpoint(): string {
    const width = this.windowRefService.nativeWindow.innerWidth;

    if (width < Breakpoint.XXS_MIN) {
      return "xxxs";
    }

    if (width < Breakpoint.XS_MIN) {
      return "xxs";
    }

    if (width < Breakpoint.SM_MIN) {
      return "xs";
    }

    if (width < Breakpoint.MD_MIN) {
      return "sm";
    }

    if (width < Breakpoint.LG_MIN) {
      return "md";
    }

    if (width < Breakpoint.XL_MIN) {
      return "lg";
    }

    if (width < Breakpoint.XXL_MIN) {
      return "xl";
    }

    return "xxl";
  }

  private _notifyItemReady(itemId: string | number) {
    if (this._isBrowser) {
      if (this._readyTimeouts.has(itemId)) {
        clearTimeout(this._readyTimeouts.get(itemId));
        this._readyTimeouts.delete(itemId);
      }
    }

    if (!this._masonryLoaded) {
      if (this._initializationLock) {
        this._pendingReadyItems.add(itemId);
        return;
      }
      this._initializationQueue.push(() => this._notifyItemReady(itemId));
      return;
    }

    // Prevent duplicate processing
    if (this._readyItems.has(itemId)) {
      return;
    }

    this._readyItems.add(itemId);

    // Use Promise to ensure sequential processing
    Promise.resolve().then(() => {
      if (this._readyItems.size === this.items.length) {
        if (!this.masonry) {
          this._initMasonry().subscribe();
        } else if (!this._layoutInProgress) {
          const items = this.container.nativeElement.querySelectorAll(".masonry-item");
          const newElements = Array.from(items).slice(this._previousItemCount);

          if (newElements.length > 0) {
            this._layoutInProgress = true;
            this.masonry.once("layoutComplete", () => {
              this._masonryLayoutComplete().subscribe();
            });
            this.masonry.appended(newElements);
          }
        }

        this._previousItemCount = this.items.length;
      }
    });
  }

  private _updateItemStates() {
    this.itemStates = this.items ? this.items.map(item => {
      const existingState = this.itemStates.find(
        state => state.data[this.idProperty] === item[this.idProperty]
      );

      // Set timeout for new items that aren't already ready
      if (this._isBrowser) {
        if (!existingState && !this._readyItems.has(item[this.idProperty]) && !this._readyTimeouts.has(item[this.idProperty])) {
          this._readyTimeouts.set(item[this.idProperty], setTimeout(() => {
            this._notifyItemReady(item[this.idProperty]);
          }, this._READY_TIMEOUT));
        }
      }

      let aspectRatio: number | undefined;

      if (item.hasOwnProperty("w") && item.hasOwnProperty("h")) {
        aspectRatio = item["w"] / item["h"];
      }

      return existingState || {
        data: item,
        visible: true,
        aspectRatio
      };
    }) : [];
  }

  private _initScrollListener() {
    fromEvent(this._scrollableParent, "scroll")
      .pipe(
        auditTime(250),
        takeUntil(this._destroyed$)
      )
      .subscribe(() => this._updateVisibleItems());
  }

  private _initResizeListener() {
    const _win = this.windowRefService.nativeWindow;
    const _doc = _win.document;
    this._cachedWindowHeight = _win.innerHeight || _doc.documentElement.clientHeight;

    if (this._isBrowser) {
      this._SCROLL_BUFFER = this._cachedWindowHeight * 2;
    }

    fromEvent(this.windowRefService.nativeWindow, "resize")
      .pipe(throttleTime(200), takeUntil(this._destroyed$))
      .subscribe(() => {
        const newBreakpoint = this._getBreakpoint();
        const breakpointChanged = this._currentBreakpoint !== newBreakpoint;
        this._currentBreakpoint = newBreakpoint;
        this._cachedWindowHeight = _win.innerHeight || _doc.documentElement.clientHeight;

        this._relayout(breakpointChanged);
      });
  }

  private _clearCaches() {
    this._boundingRects.clear();
    this._cachedWindowHeight = 0;
  }

  private _relayout(reloadItems: boolean) {
    if (this.masonry && !this._layoutInProgress) {
      this._clearCaches();

      this.itemStates = this.items.map(item => ({
        data: item,
        visible: true
      }));

      requestAnimationFrame(() => {
        this._layoutInProgress = true;

        if (reloadItems) {
          this.masonry.reloadItems();
        }

        this.masonry.once("layoutComplete", () => this._masonryLayoutComplete().subscribe());
        this.masonry.layout();
      });
    }
  }

  private _updateVisibleItems() {
    if (
      !this._isBrowser ||
      !this.container ||
      this._layoutInProgress ||
      this._readyItems?.size !== this.items?.length
    ) {
      return;
    }

    const viewportStart = this._scrollableParent instanceof Window ?
      this._scrollableParent.scrollY :
      this._scrollableParent.scrollTop;
    const viewportEnd = viewportStart + this._cachedWindowHeight;

    this.itemStates.forEach(item => {
      if (item.offsetTop !== undefined && item.height) {
        const itemStart = this._containerTop + item.offsetTop;
        const itemEnd = itemStart + item.height;

        item.visible = (
          !this._readyItems.has(item.data[this.idProperty]) ||
          (
            itemEnd >= viewportStart - this._SCROLL_BUFFER &&
            itemStart <= viewportEnd + this._SCROLL_BUFFER
          )
        );
      }
    });
  }

  private _masonryLayoutComplete(firstIndex = 0): Observable<void> {
    return new Observable(observer => {
      const items = this.container.nativeElement.querySelectorAll(".masonry-item") as NodeListOf<HTMLElement>;

      // Calculate container's offset relative to its scrollable parent
      let element = this.container.nativeElement;
      let offset = 0;

      if (this._scrollableParent instanceof Window) {
        // If scrollable parent is window, get offset relative to document
        while (element) {
          offset += element.offsetTop;
          element = element.offsetParent as HTMLElement;
        }
      } else {
        // If scrollable parent is an element, get offset relative to that element
        const parentRect = this._scrollableParent.getBoundingClientRect();
        const elementRect = this.container.nativeElement.getBoundingClientRect();
        offset = elementRect.top - parentRect.top + this._scrollableParent.scrollTop;
      }

      this._containerTop = offset;

      requestAnimationFrame(() => {
        this._layoutInProgress = false;

        Array.from(items).slice(firstIndex).forEach(item => {
          const itemId = item.getAttribute("data-masonry-id");
          const itemState = this.itemStates.find(state => state.data[this.idProperty].toString() === itemId);

          if (itemState) {
            // Cache both height and offsetTop in the itemState itself
            itemState.height = item.getBoundingClientRect().height;
            itemState.offsetTop = item.offsetTop;
          }

          item.style.opacity = "1";
        });

        this._updateVisibleItems();

        this.layoutReady.emit();

        observer.next();
        observer.complete();
      });
    });
  }

  private _destroyMasonry() {
    if (this.masonry) {
      this.masonry.destroy();
      this.masonry = null;

      // Reset all states
      this._pendingReadyItems.clear();
      this._readyItems.clear();
      this._readyTimeouts.clear();
      this.itemStates = [];
      this._previousItemCount = 0;
      this._layoutInProgress = false;
    }
  }

  private _initMasonry(): Observable<void> {
    if (!this._isBrowser || !this.MasonryModule || !this.container) {
      return of(null);
    }

    return new Observable(observer => {
      this.masonry = new this.MasonryModule.default(this.container.nativeElement, {
        itemSelector: ".masonry-item",
        columnWidth: ".masonry-item",
        percentPosition: true,
        gutter: this.gutter,
        transitionDuration: "0"
      });

      requestAnimationFrame(() => {
        this._layoutInProgress = true;
        this.masonry.once("layoutComplete", () => {
          this._masonryLayoutComplete().subscribe(() => {
            this.utilsService.delay(100).subscribe(() => {
              this._updateVisibleItems();  // Force visibility update
              observer.next();
              observer.complete();
            });
          });
        });

        this.masonry.layout();
      });
    });
  }

  private _reloadMasonry(): Observable<void> {
    return new Observable(observer => {
      this._destroyMasonry();

      this.changeDetectorRef.detectChanges();

      this._updateItemStates();

      observer.next();
      observer.complete();
    });
  }
}
