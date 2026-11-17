declare global {
  interface Strack {
    DataUrls: "pokedex.json" | "learnsets.json" | "moves.json";
    Pokemon: {
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
    };
    LearnSet: { move: string; level?: number; how?: "tm" | "tutor" }[];
    Move: {
      num: number;
      acc: number | true;
      power: number;
      category: string;
      name: string;
      pp: number;
      priority: number;
      critRatio: number;
      type: string;
      target: string;
      desc: string;

      multihit?: [number, number];
      zPower?: number;
    };
  }
  interface Scarlet {
    DataUrls: "personal_array.json" | "waza_array.json" | "waza.txt";
    Pokemon: {
      species: {
        species: string;
        form: number;
        weight: number;
      };
      type_1: string;
      type_2: string;
      ability_1: string;
      ability_2: string;
      ability_hidden: string;
      base_stats: Record<"HP" | "ATK" | "DEF" | "SPA" | "SPD" | "SPE", number>;
      evo_data: {
        species: string;
        form: number;
      }[];
      tm_moves?: string[];
      levelup_moves: {
        move: string;
        level: number;
      }[];
    };
    Move: {
      move_id: string;
      type: string;
      category: string;
      power: number;
      accuracy: number;
      pp: number;
    };
  }

  type DataUrls = Record<Strack["DataUrls"] | Scarlet["DataUrls"], string>;
}

export {};
