import { inject } from '@angular/core/testing';

import { SheetModalConfig } from './sheet-modal-config';

describe('SheetModalConfig', () => {

    it('should have sensible default values', inject([SheetModalConfig], (config: SheetModalConfig) => {

        expect(config.backdrop).toBe(true);
        expect(config.keyboard).toBe(true);
        expect(config.bounceAnimation).toBe(true);
        expect(config.showBorderOnScroll).toBe(true);
    }));
});
