export interface broadcaster {
    constructor(data: object, config: object);
    broadcast(data: object, secureData: object): void;
}
