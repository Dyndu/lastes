import * as nestCommon from '@nestjs/common';
import * as swagger from '@nestjs/swagger';
import * as decorators from './index';

describe('Exports', () => {
    describe('NestJS Common decorators', () => {
        it('should export Controller', () => {
            expect(decorators.Controller).toBeDefined();
            expect(decorators.Controller).toBe(nestCommon.Controller);
        });

        it('should export Get', () => {
            expect(decorators.Get).toBeDefined();
            expect(decorators.Get).toBe(nestCommon.Get);
        });

        it('should export Post', () => {
            expect(decorators.Post).toBeDefined();
            expect(decorators.Post).toBe(nestCommon.Post);
        });

        it('should export Body', () => {
            expect(decorators.Body).toBeDefined();
            expect(decorators.Body).toBe(nestCommon.Body);
        });

        it('should export Patch', () => {
            expect(decorators.Patch).toBeDefined();
            expect(decorators.Patch).toBe(nestCommon.Patch);
        });

        it('should export Param', () => {
            expect(decorators.Param).toBeDefined();
            expect(decorators.Param).toBe(nestCommon.Param);
        });

        it('should export ParseUUIDPipe', () => {
            expect(decorators.ParseUUIDPipe).toBeDefined();
            expect(decorators.ParseUUIDPipe).toBe(nestCommon.ParseUUIDPipe);
        });

        it('should export Delete', () => {
            expect(decorators.Delete).toBeDefined();
            expect(decorators.Delete).toBe(nestCommon.Delete);
        });

        it('should export UseGuards', () => {
            expect(decorators.UseGuards).toBeDefined();
            expect(decorators.UseGuards).toBe(nestCommon.UseGuards);
        });

        it('should export Query', () => {
            expect(decorators.Query).toBeDefined();
            expect(decorators.Query).toBe(nestCommon.Query);
        });

        it('should export NotFoundException', () => {
            expect(decorators.NotFoundException).toBeDefined();
            expect(decorators.NotFoundException).toBe(nestCommon.NotFoundException);
        });

        it('should export ValidationPipe', () => {
            expect(decorators.ValidationPipe).toBeDefined();
            expect(decorators.ValidationPipe).toBe(nestCommon.ValidationPipe);
        });

        it('should export UploadedFile', () => {
            expect(decorators.UploadedFile).toBeDefined();
            expect(decorators.UploadedFile).toBe(nestCommon.UploadedFile);
        });

        it('should export UploadedFiles', () => {
            expect(decorators.UploadedFiles).toBeDefined();
            expect(decorators.UploadedFiles).toBe(nestCommon.UploadedFiles);
        });

        it('should export UseInterceptors', () => {
            expect(decorators.UseInterceptors).toBeDefined();
            expect(decorators.UseInterceptors).toBe(nestCommon.UseInterceptors);
        });

        it('should export Req', () => {
            expect(decorators.Req).toBeDefined();
            expect(decorators.Req).toBe(nestCommon.Req);
        });

        it('should export Res', () => {
            expect(decorators.Res).toBeDefined();
            expect(decorators.Res).toBe(nestCommon.Res);
        });
    });

    describe('Swagger decorators', () => {
        it('should export ApiBearerAuth', () => {
            expect(decorators.ApiBearerAuth).toBeDefined();
            expect(decorators.ApiBearerAuth).toBe(swagger.ApiBearerAuth);
        });

        it('should export ApiOperation', () => {
            expect(decorators.ApiOperation).toBeDefined();
            expect(decorators.ApiOperation).toBe(swagger.ApiOperation);
        });

        it('should export ApiParam', () => {
            expect(decorators.ApiParam).toBeDefined();
            expect(decorators.ApiParam).toBe(swagger.ApiParam);
        });

        it('should export ApiQuery', () => {
            expect(decorators.ApiQuery).toBeDefined();
            expect(decorators.ApiQuery).toBe(swagger.ApiQuery);
        });

        it('should export ApiResponse', () => {
            expect(decorators.ApiResponse).toBeDefined();
            expect(decorators.ApiResponse).toBe(swagger.ApiResponse);
        });

        it('should export ApiBody', () => {
            expect(decorators.ApiBody).toBeDefined();
            expect(decorators.ApiBody).toBe(swagger.ApiBody);
        });

        it('should export ApiConsumes', () => {
            expect(decorators.ApiConsumes).toBeDefined();
            expect(decorators.ApiConsumes).toBe(swagger.ApiConsumes);
        });

        it('should export ApiTags', () => {
            expect(decorators.ApiTags).toBeDefined();
            expect(decorators.ApiTags).toBe(swagger.ApiTags);
        });
    });
});
