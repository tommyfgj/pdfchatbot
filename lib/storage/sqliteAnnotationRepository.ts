import Database from 'better-sqlite3';
import type { AnnotationRepository, ListAnnotationsFilter } from './annotationRepository';
import type { IAnnotationStore, IAnnotationComment } from '../../pdfjs-annotation-extension-src/src/const/definitions';
import { serializeAnnotation, deserializeAnnotation } from './annotationRepository';

const DB_PATH = process.env.ANNOTATION_DB_PATH || 'annotations.db';

export class SqliteAnnotationRepository implements AnnotationRepository {
  private db: Database;

  constructor() {
    this.db = new Database(DB_PATH);
  }

  public initialize(): void {
    // Create tables first
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        docId TEXT NOT NULL DEFAULT 'default',
        username TEXT NOT NULL DEFAULT 'unknown',
        pageNumber INTEGER NOT NULL,
        title TEXT NOT NULL,
        type INTEGER NOT NULL,
        color TEXT,
        subtype TEXT NOT NULL,
        fontSize INTEGER,
        pdfjsType INTEGER NOT NULL,
        pdfjsEditorType INTEGER NOT NULL,
        date TEXT NOT NULL,
        konvaClientRect TEXT NOT NULL,
        contentsText TEXT,
        contentsImage TEXT,
        resizable INTEGER NOT NULL,
        draggable INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        annotationId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        status INTEGER,
        FOREIGN KEY (annotationId) REFERENCES annotations(id) ON DELETE CASCADE
      );
    `);

    // Migration: ensure columns exist on older DBs before creating indexes
    const columns = this.db.prepare('PRAGMA table_info(annotations)').all() as any[];
    const hasKonvaString = columns.some((c) => c.name === 'konvaString');
    const hasDocId = columns.some((c) => c.name === 'docId');
    const hasUsername = columns.some((c) => c.name === 'username');
    if (!hasKonvaString) {
      this.db.exec('ALTER TABLE annotations ADD COLUMN konvaString TEXT');
    }
    if (!hasDocId) {
      this.db.exec("ALTER TABLE annotations ADD COLUMN docId TEXT NOT NULL DEFAULT 'default'");
    }
    if (!hasUsername) {
      this.db.exec("ALTER TABLE annotations ADD COLUMN username TEXT NOT NULL DEFAULT 'unknown'");
    }

    // Create indexes after migration to avoid referencing missing columns
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_annotations_doc_user_page ON annotations(docId, username, pageNumber);
      CREATE INDEX IF NOT EXISTS idx_annotations_doc_user_title ON annotations(docId, username, title);
      CREATE INDEX IF NOT EXISTS idx_comments_annotation ON comments(annotationId);
    `);
  }

  async saveAnnotation(docId: string, username: string, annotation: IAnnotationStore): Promise<IAnnotationStore> {
    const row = serializeAnnotation(annotation);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO annotations (
        id, docId, username, pageNumber, title, type, color, subtype, fontSize, pdfjsType, pdfjsEditorType, date, konvaClientRect, konvaString,
        contentsText, contentsImage, resizable, draggable
      ) VALUES (
        @id, @docId, @username, @pageNumber, @title, @type, @color, @subtype, @fontSize, @pdfjsType, @pdfjsEditorType, @date, @konvaClientRect, @konvaString,
        @contentsText, @contentsImage, @resizable, @draggable
      );
    `);
    stmt.run({
      id: row.id,
      docId,
      username,
      pageNumber: row.pageNumber,
      title: row.title,
      type: row.type,
      color: row.color,
      subtype: row.subtype,
      fontSize: row.fontSize,
      pdfjsType: row.pdfjsType,
      pdfjsEditorType: row.pdfjsEditorType,
      date: row.date,
      konvaClientRect: row.konvaClientRect,
      konvaString: annotation.konvaString,
      contentsText: row.contentsText,
      contentsImage: row.contentsImage,
      resizable: row.resizable,
      draggable: row.draggable,
    });

    // Persist comments: replace all for this annotation
    this.db.prepare(`DELETE FROM comments WHERE annotationId = @annotationId`).run({ annotationId: row.id });
    for (const c of annotation.comments || []) {
      this.db.prepare(`
        INSERT OR REPLACE INTO comments(id, annotationId, title, content, date, status)
        VALUES(@id, @annotationId, @title, @content, @date, @status)
      `).run({
        id: c.id,
        annotationId: row.id,
        title: c.title,
        content: c.content,
        date: c.date,
        status: c.status ?? null,
      });
    }

    return annotation;
  }

  async getAnnotationById(docId: string, username: string, id: string): Promise<IAnnotationStore | null> {
    const ann = this.db.prepare(`SELECT id, docId, username, pageNumber, title, type, color, subtype, fontSize, pdfjsType, pdfjsEditorType, date, konvaClientRect, konvaString, contentsText, contentsImage, resizable, draggable FROM annotations WHERE id = @id AND docId = @docId AND username = @username`).get({ id, docId, username });
    if (!ann) return null;
    const comments = this.db
      .prepare(`SELECT * FROM comments WHERE annotationId = @annotationId ORDER BY date ASC`)
      .all({ annotationId: id }) as any[];
    return deserializeAnnotation(ann, comments.map((c) => ({ id: c.id, title: c.title, content: c.content, date: c.date, status: c.status })));
  }

  async listAnnotations(docId: string, username: string, filter?: ListAnnotationsFilter): Promise<IAnnotationStore[]> {
    const where: string[] = ['docId = @docId', 'username = @username'];
    const params: Record<string, any> = { docId, username };
    if (filter?.pageNumber != null) { where.push('pageNumber = @pageNumber'); params.pageNumber = filter.pageNumber; }
    if (filter?.author) { where.push('title = @author'); params.author = filter.author; }
    if (filter?.type != null) { where.push('type = @type'); params.type = filter.type; }
    if (filter?.subtype) { where.push('subtype = @subtype'); params.subtype = filter.subtype; }

    const sql = `SELECT id, docId, username, pageNumber, title, type, color, subtype, fontSize, pdfjsType, pdfjsEditorType, date, konvaClientRect, konvaString, contentsText, contentsImage, resizable, draggable FROM annotations ${'WHERE ' + where.join(' AND ')} ORDER BY pageNumber ASC, date DESC`;
    const rows = this.db.prepare(sql).all(params) as any[];
    return rows.map((r) => {
      const comments = this.db
        .prepare(`SELECT * FROM comments WHERE annotationId = @annotationId ORDER BY date ASC`)
        .all({ annotationId: r.id }) as any[];
      return deserializeAnnotation(r, comments.map((c) => ({ id: c.id, title: c.title, content: c.content, date: c.date, status: c.status })));
    });
  }

  async updateAnnotation(docId: string, username: string, annotation: IAnnotationStore): Promise<IAnnotationStore> {
    return this.saveAnnotation(docId, username, annotation);
  }

  async deleteAnnotation(docId: string, username: string, id: string): Promise<void> {
    // Ensure scope matches docId+username
    this.db.prepare(`DELETE FROM comments WHERE annotationId = @annotationId`).run({ annotationId: id });
    this.db.prepare(`DELETE FROM annotations WHERE id = @id AND docId = @docId AND username = @username`).run({ id, docId, username });
  }

  async pruneAnnotationsExcept(docId: string, username: string, keepIds: string[]): Promise<void> {
    const idsParam = keepIds.length ? keepIds : ['__EMPTY__'];
    // Delete comments first to honor FK
    this.db.prepare(`DELETE FROM comments WHERE annotationId IN (
      SELECT id FROM annotations WHERE docId = @docId AND username = @username AND id NOT IN (${idsParam.map(() => '?').join(',')})
    )`).run({ docId, username }, idsParam);
    this.db.prepare(`DELETE FROM annotations WHERE docId = @docId AND username = @username AND id NOT IN (${idsParam.map(() => '?').join(',')})`).run({ docId, username }, idsParam);
  }

  async addComment(annotationId: string, comment: IAnnotationComment): Promise<IAnnotationComment> {
    this.db.prepare(`
      INSERT OR REPLACE INTO comments(id, annotationId, title, content, date, status)
      VALUES(@id, @annotationId, @title, @content, @date, @status)
    `).run({
      id: comment.id,
      annotationId: annotationId,
      title: comment.title,
      content: comment.content,
      date: comment.date,
      status: comment.status ?? null,
    });
    return comment;
  }

  async updateComment(comment: IAnnotationComment): Promise<IAnnotationComment> {
    this.db.prepare(`
      UPDATE comments SET title = @title, content = @content, date = @date, status = @status WHERE id = @id
    `).run({
      id: comment.id,
      title: comment.title,
      content: comment.content,
      date: comment.date,
      status: comment.status ?? null,
    });
    return comment;
  }

  async deleteComment(commentId: string): Promise<void> {
    this.db.prepare(`DELETE FROM comments WHERE id = @id`).run({ id: commentId });
  }
}

export function getRepository(): SqliteAnnotationRepository {
  const repo = new SqliteAnnotationRepository();
  repo.initialize();
  return repo;
}
