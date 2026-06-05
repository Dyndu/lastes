export interface JwtPayload {
    sub: string;
    sid: string;
    role: string;
    ver: number;
    type: 'access';
}
