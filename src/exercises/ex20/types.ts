export interface Article {
  slug: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface FetchReturn<T> {
  data: import("vue").Ref<T | null>;
  pending: import("vue").Ref<boolean>;
  error: import("vue").Ref<string | null>;
  refresh: () => Promise<void>;
}
