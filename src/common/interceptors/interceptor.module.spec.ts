import { CallHandler, ExecutionContext, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { CircularInterceptor } from './circular.interceptor';
import { InterceptorModule } from './interceptor.module';

type CircularType = { a: number; self?: CircularType };

class TestController {
    @Get()
    getData(): CircularType {
        const obj: CircularType = { a: 1 };
        obj.self = obj;
        return obj;
    }
}

describe('InterceptorModule', () => {
    let controller: TestController;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [InterceptorModule],
            controllers: [TestController],
        }).compile();

        controller = moduleRef.get(TestController);
    });

    it('should compile the module', () => {
        expect(controller).toBeDefined();
    });

    it('should apply CircularInterceptor globally', (done) => {
        type CircularType = { a: number; self?: CircularType };

        const interceptor = new CircularInterceptor();

        const mockContext: ExecutionContext = {
            switchToHttp: () => ({
                getRequest: () => ({}),
                getResponse: () => ({}),
            }),
        } as ExecutionContext;

        const mockHandler: CallHandler<CircularType> = {
            handle: () => of({ a: 1, self: undefined } as CircularType),
        };

        const circularObject = { a: 1 } as CircularType;
        circularObject.self = circularObject;
        mockHandler.handle = () => of(circularObject);

        const observable = interceptor.intercept(mockContext, mockHandler);

        observable.subscribe((res: CircularType) => {
            expect(res.a).toBe(1);
            expect(res.self).toBe(res);
            done();
        });
    });
});
