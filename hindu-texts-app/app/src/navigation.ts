export type RootStackParamList = {
  Home: undefined;
  Category: { category: string };
  Reader: { workId: string; chapterIndex?: number };
  Search: { query?: string } | undefined;
};
