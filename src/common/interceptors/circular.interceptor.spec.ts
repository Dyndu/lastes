import { CircularInterceptor } from './circular.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

jest.mock('flatted', () => ({
    stringify: jest.fn((data) => JSON.stringify(data)),
    parse: jest.fn((data) => JSON.parse(data)),
}));

import * as flatted from 'flatted';

describe('CircularInterceptor', () => {
    let interceptor: CircularInterceptor;

    beforeEach(() => {
        interceptor = new CircularInterceptor();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should transform response data by stringify and parse', (done) => {
        const data = { test: 'value' };

        const context = {} as ExecutionContext;
        const callHandler: CallHandler<typeof data> = {
            handle: () => of(data),
        };

        interceptor.intercept(context, callHandler).subscribe((result: typeof data) => {
            expect(result).toEqual(data);
            expect(flatted.stringify).toHaveBeenCalledWith(data);
            expect(flatted.parse).toHaveBeenCalled();
            done();
        });
    });

    it('should handle circular references safely', (done) => {
        // Use real flatted implementation for this test
        jest.unmock('flatted');
        const realFlatted = jest.requireActual('flatted');
        (flatted.stringify as jest.Mock).mockImplementation(realFlatted.stringify);
        (flatted.parse as jest.Mock).mockImplementation(realFlatted.parse);

        type CircularType = { a: number; self?: CircularType };
        const obj: CircularType = { a: 1 };
        obj.self = obj;

        const context = {} as ExecutionContext;
        const callHandler: CallHandler<CircularType> = {
            handle: () => of(obj),
        };

        interceptor.intercept(context, callHandler).subscribe((result: CircularType) => {
            expect(result.a).toBe(1);
            expect(result.self).toBe(result);
            done();
        });
    });
});
