export interface CurrentUserInterface {
    id: string;
    role: string;
    status: string;
    sessionId: string;
    subId: string | null;
    subStatus: string | null;
    permissions: Record<string, string[]>;
}
