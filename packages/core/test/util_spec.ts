/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {getGlobal, global, stringify} from '../src/util';

{
  describe('stringify', () => {
    it('should return string undefined when toString returns undefined',
       () => expect(stringify({toString: (): any => undefined})).toBe('undefined'));

    it('should return string null when toString returns null',
       () => expect(stringify({toString: (): any => null})).toBe('null'));
  });

  describe('getGlobal', () => {
    const _global: any = new Function('return this')();
    const originalSelfDescriptor = Object.getOwnPropertyDescriptor(_global, 'self');
    const originalWGSDescriptor = Object.getOwnPropertyDescriptor(_global, 'WorkerGlobalScope');
    let FunctionSpy: any;

    beforeEach(() => { FunctionSpy = spyOn(_global, 'Function').and.callThrough(); });

    afterEach(() => {
      delete _global['self'];
      delete _global['WorkerGlobalScope'];

      if (originalSelfDescriptor) {
        Object.defineProperty(_global, 'self', originalSelfDescriptor);
      }

      if (originalWGSDescriptor) {
        Object.defineProperty(_global, 'WorkerGlobalScope', originalWGSDescriptor);
      }
    });

    it('should return evaluated this', () => {
      expect(getGlobal()).toBe(_global);
      expect(FunctionSpy).toHaveBeenCalledWith('return this');
    });

    it('should not fall back to duck typing', () => {
      class WGSMock {};
      _global['WorkerGlobalScope'] = WGSMock;
      const self = new WGSMock();
      Object.defineProperty(
          _global, 'self', {value: self, writable: false, enumerable: true, configurable: true});

      expect(getGlobal()).toBe(_global);
    });

    it('should fall back to duck typed global when eval is restricted', () => {
      FunctionSpy.and.throwError(EvalError);

      expect(getGlobal).not.toThrow();
      expect(FunctionSpy).toHaveBeenCalledWith('return this');
    });

    if (getDOM().supportsDOMEvents()) {
      it('should fall back to self in web worker', () => {
        FunctionSpy.and.throwError(EvalError);

        class WGSMock {};
        _global['WorkerGlobalScope'] = WGSMock;
        const self = new WGSMock();
        Object.defineProperty(
            _global, 'self', {value: self, writable: false, enumerable: true, configurable: true});

        expect(getGlobal()).toBe(self);
      });

      it('should fall back to window in browser', () => {
        FunctionSpy.and.throwError(new EvalError());

        expect(getGlobal()).toBe(_global);
      });
    }
  });

  describe('global', () => {
    it('should get value from getGlobal()', () => { expect(global).toBe(getGlobal()); });
  });
}
