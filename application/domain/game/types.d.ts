import * as _Game from 'application/lib/game/types';
import { GameObject, GameObjectData, GameObjectConfig, objects as _objects } from 'application/lib/game/types';
import { ObjectId } from 'mongodb';

export default class Game extends _Game {
  checkStatus(data: { cause: string }): void;
}

interface PlaneData extends GameObjectData {
  width: number;
  height: number;
  left: number;
  top: number;
  price: number;
}
interface PortData extends GameObjectData {
  left: number;
  top: number;
  direct: PortDirections;
}
type PortDirections = 'bottom' | 'top' | 'left' | 'right';
interface PortDirectionData {
  oppositeDirection: PortDirections[];
  nextDirection: PortDirections[];
  bridge: { vertical: boolean; reverse: boolean };
}
interface ZoneData extends GameObjectData {
  left: number;
  top: number;
  vertical: boolean;
  double: boolean;
}
interface ZoneSideData extends GameObjectData {
  value: number;
  links: { [key: string]: string };
  expectedValues: { [key: string]: boolean };
}
interface DiceData extends GameObjectData {
  deleted: boolean;
  visible: boolean;
  locked: boolean;
  placedAtRound: number;
}
interface DiceSideData extends GameObjectData {
  value: number;
}

export namespace objects {
  class Player extends _objects.Player {}
  class Plane extends GameObject {
    constructor(data: PlaneData, config: GameObjectConfig);
    getPosition(): { left: number; right: number; top: number; bottom: number };
  }
  class Port extends GameObject {
    constructor(data: PortData, config: GameObjectConfig);
    static DIRECTIONS: { [key: PortDirections]: PortDirectionData };
    getDirect(): PortDirectionData;
    updateDirect(direct: PortDirections): boolean | PortDirectionData;
  }
  class Zone extends GameObject {
    constructor(data: ZoneData, config: GameObjectConfig);
    sideList: ZoneSide[];
    itemMap: { [key: string]: object };
    /**
     * устанавливает value зоны в соответствии с размещенным в нем dice
     */
    updateValues: void;
  }
  class ZoneSide extends GameObject {
    constructor(data: ZoneSideData, config: GameObjectConfig);
    /**
     * (используется в zone.checkIsAvailable)
     */
    updateExpectedValues: void;
  }
  class Dice extends GameObject {
    constructor(data: DiceData, config: GameObjectConfig);
    sideList: DiceSide[];
    moveToTarget(target: objects.Deck | objects.Zone): boolean;
  }
  class DiceSide extends GameObject {
    constructor(data: DiceSideData, config: GameObjectConfig);
  }
  class Bridge extends _objects.Player {}
  class Deck extends _objects.Deck {}
  class Card extends _objects.Card {}
}
