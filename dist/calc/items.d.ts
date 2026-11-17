import { Generation, TypeName, StatID } from './data/interface';
export declare const SEED_BOOSTED_STAT: {
    [item: string]: StatID;
};
export declare function getItemBoostType(item: string | undefined): "Rock" | "Grass" | "Psychic" | "Steel" | "Bug" | "Ghost" | "Dark" | "Dragon" | "Ground" | "Fairy" | "Fire" | "Ice" | "Poison" | "Electric" | "Water" | "Fighting" | "Normal" | "Flying" | undefined;
export declare function getBerryResistType(berry: string | undefined): "Rock" | "Grass" | "Psychic" | "Steel" | "Bug" | "Ghost" | "Dark" | "Dragon" | "Ground" | "Fairy" | "Fire" | "Ice" | "Poison" | "Electric" | "Water" | "Fighting" | "Normal" | "Flying" | undefined;
export declare function getFlingPower(item?: string): 50 | 0 | 100 | 10 | 150 | 20 | 80 | 60 | 40 | 85 | 110 | 95 | 90 | 70 | 30;
export declare function getNaturalGift(gen: Generation, item: string): {
    t: TypeName;
    p: number;
};
export declare function getTechnoBlast(item: string): "Fire" | "Ice" | "Electric" | "Water" | undefined;
export declare function getMultiAttack(item: string): TypeName | undefined;
