/** Placeholder roster shown on the Friends tab until a real friends/contacts feature exists. */
export type SampleFriend = {
  id: string;
  name: string;
  handicap: number;
};

export const SAMPLE_FRIENDS: SampleFriend[] = [
  { id: "friend_blake", name: "Blake Johnson", handicap: 10.2 },
  { id: "friend_jordan", name: "Jordan Smith", handicap: 12.4 },
  { id: "friend_sam", name: "Sam Williams", handicap: 9.1 },
];
