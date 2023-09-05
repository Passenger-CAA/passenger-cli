export interface ProseMirrorNode {
  type: string;
  content?: ProseMirrorContent[];
  text?: string;
  marks?: { type: string }[];
}

export type ProseMirrorContent = ProseMirrorNode;

export interface ProseMirrorDocument {
  version: number;
  type: string;
  content: ProseMirrorContent[];
}
