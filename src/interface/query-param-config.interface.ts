export interface QueryParamConfigInterface {
    name: string;
    description: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
    enum?: object;
    isArray?: boolean;
}
