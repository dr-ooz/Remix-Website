declare global {
  interface SheetRange {
    gid: number;
    range: string;
  }

  interface PokemonData {
    num: number;
    name: string;
    types: [string, string?];
    baseStats: [hp: number, atk: number, def: number, spa: number, spd: number, spe: number];
    abilities: [string, string?, string?];
    weight: number;

    prevo?: string;
    evos?: string[];

    baseSpecies?: string;
    form?: string;

    unusable?: boolean;

    learntMoves: [string, number | "tm" | "tutor"][];

    range?: SheetRange;
    signatureItem?: string;
  }

  interface MoveData {
    num: number;
    acc: number;
    power: number;
    category: string;
    name: string;
    pp: number;
    type: string;
    desc: string;

    zPower?: number;
  }

  interface Data {
    pokedex: Record<string, PokemonData>;
    moves: Record<string, MoveData>;
    sheetId: string;
  }
}

export {};
