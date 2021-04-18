export interface Me {
  avatar: string;
  username: string;
  id: string;
  player?: Player;
  referee?: Referee;
  commentator?: Commentator;
  streamer?: Streamer;
  qualifier?: QualifierLobby;
}

export interface Player {
  id: string;
  username: string;
  discord: string;
  country: string;
  country_code: string;
  avatar: string;
  timezone: string;
  ranking: number;
  pp: number;
  qualifier: QualifierLobby;
}

export interface Referee {
  id: string;
  username: string;
  discord: string;
  country: string;
  country_code: string;
  avatar: string;
  timezone: string;
}

export interface Commentator {
  id: string;
  username: string;
  discord: string;
  country: string;
  country_code: string;
  avatar: string;
  timezone: string;
}

export interface Streamer {
  id: string;
  username: string;
  discord: string;
  country: string;
  country_code: string;
  avatar: string;
  timezone: string;
}

export interface Stage {
  slug: string;
  name: string;
  date_start: string;
  date_end: string;
  link?: string;
}

export interface QualifierLobby {
  name: string;
  link: string | null;
  time: string;
  players: Player[];
  referee: Referee | null;
  available_referees: {
    rel_id: number;
    referee: Referee;
  }[];
};

export interface Map {
  id: string;
  artist: string;
  name: string;
  difficulty: string;
  charter: string;
  charter_id: string;
  category: string;
  bpm: number;
  length: string;
  od: number;
  hp: number;
  sr: number;
  rice: number;
  ln: number;
  cover: string;
}
