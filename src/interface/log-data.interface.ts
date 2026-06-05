export interface LogData {
    message: string;
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    body?: unknown;
}
