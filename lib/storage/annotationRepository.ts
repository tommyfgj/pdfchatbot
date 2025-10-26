import type { IAnnotationStore, IAnnotationComment } from '../../pdfjs-annotation-extension-src/src/const/definitions'

export type ListAnnotationsFilter = {
  pageNumber?: number;
  author?: string;
  type?: number;
  subtype?: string;
};

export interface AnnotationRepository {
  initialize(): void;

  saveAnnotation(docId: string, username: string, annotation: IAnnotationStore): Promise<IAnnotationStore>;
  getAnnotationById(docId: string, username: string, id: string): Promise<IAnnotationStore | null>;
  listAnnotations(docId: string, username: string, filter?: ListAnnotationsFilter): Promise<IAnnotationStore[]>;
  updateAnnotation(docId: string, username: string, annotation: IAnnotationStore): Promise<IAnnotationStore>;
  deleteAnnotation(docId: string, username: string, id: string): Promise<void>;
  pruneAnnotationsExcept(docId: string, username: string, keepIds: string[]): Promise<void>;

  addComment(annotationId: string, comment: IAnnotationComment): Promise<IAnnotationComment>;
  updateComment(comment: IAnnotationComment): Promise<IAnnotationComment>;
  deleteComment(commentId: string): Promise<void>;
}

export function serializeAnnotation(annotation: IAnnotationStore): any {
  const contentsText = annotation.contentsObj?.text ?? '';
  const contentsImage = annotation.contentsObj?.image ?? null;
  return {
    id: annotation.id,
    pageNumber: annotation.pageNumber,
    title: annotation.title,
    type: annotation.type,
    color: annotation.color ?? null,
    subtype: annotation.subtype,
    fontSize: annotation.fontSize ?? null,
    pdfjsType: annotation.pdfjsType,
    pdfjsEditorType: annotation.pdfjsEditorType,
    date: annotation.date,
    konvaClientRect: JSON.stringify(annotation.konvaClientRect),
    konvaString: annotation.konvaString,
    contentsText,
    contentsImage,
    resizable: annotation.resizable ? 1 : 0,
    draggable: annotation.draggable ? 1 : 0,
  };
}

export function deserializeAnnotation(row: any, comments: IAnnotationComment[] = []): IAnnotationStore {
  return {
    id: row.id,
    pageNumber: Number(row.pageNumber),
    title: row.title,
    type: Number(row.type),
    color: row.color,
    subtype: row.subtype,
    fontSize: row.fontSize == null ? null : Number(row.fontSize),
    pdfjsType: Number(row.pdfjsType),
    pdfjsEditorType: Number(row.pdfjsEditorType),
    date: row.date,
    konvaClientRect: JSON.parse(row.konvaClientRect),
    contentsObj: {
      text: row.contentsText ?? '',
      image: row.contentsImage ?? undefined,
    },
    konvaString: row.konvaString,

    comments,
    resizable: !!row.resizable,
    draggable: !!row.draggable,
  };
}
