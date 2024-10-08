export interface Payload {
    [key: string]: string | string[] | number | number[] | boolean | boolean[] | Payload | Payload[];
}
