export interface BlogBlock {
  id: string;
  type: "text" | "image";
  value: string; // text content or image URL
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  published: boolean;
  blocks: BlogBlock[];
}
