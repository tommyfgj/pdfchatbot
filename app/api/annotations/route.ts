import { NextResponse } from 'next/server';
import { getRepository } from '../../../lib/storage/sqliteAnnotationRepository';
import type { IAnnotationStore, IAnnotationComment } from '../../../pdfjs-annotation-extension-src/src/const/definitions';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const repo = getRepository();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId') || searchParams.get('fingerprint') || 'default';
    const username = searchParams.get('username') || searchParams.get('ae_username') || 'unknown';
    const pageNumber = searchParams.get('pageNumber');
    const author = searchParams.get('author');
    const type = searchParams.get('type');
    const subtype = searchParams.get('subtype');

    console.log('[API GET] /api/annotations', { docId, username, pageNumber, author, type, subtype });
    const list = await repo.listAnnotations(docId, username, {
      pageNumber: pageNumber ? Number(pageNumber) : undefined,
      author: author || undefined,
      type: type ? Number(type) : undefined,
      subtype: subtype || undefined,
    });
    return NextResponse.json(list);
  } catch (err: any) {
    console.error('[GET /api/annotations] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const repo = getRepository();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId') || searchParams.get('fingerprint') || 'default';
    const username = searchParams.get('username') || searchParams.get('ae_username') || 'unknown';
    const body = (await req.json()) as IAnnotationStore | IAnnotationStore[];

    console.log('[API POST] /api/annotations', { docId, username, isArray: Array.isArray(body), length: Array.isArray(body) ? body.length : 1 });
    if (Array.isArray(body)) {
      const saved: IAnnotationStore[] = [];
      const keepIds: string[] = [];
      for (const ann of body) {
        saved.push(await repo.saveAnnotation(docId, username, ann));
        keepIds.push(ann.id);
      }
      // Prune records that are not in current payload (full-sync save)
      await repo.pruneAnnotationsExcept(docId, username, keepIds);
      return NextResponse.json(saved, { status: 201 });
    }

    const saved = await repo.saveAnnotation(docId, username, body);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/annotations] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const repo = getRepository();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId') || searchParams.get('fingerprint') || 'default';
    const username = searchParams.get('username') || searchParams.get('ae_username') || 'unknown';
    const body = (await req.json()) as IAnnotationStore;
    const saved = await repo.updateAnnotation(docId, username, body);
    return NextResponse.json(saved);
  } catch (err: any) {
    console.error('[PUT /api/annotations] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const repo = getRepository();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId') || searchParams.get('fingerprint') || 'default';
    const username = searchParams.get('username') || searchParams.get('ae_username') || 'unknown';
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
    await repo.deleteAnnotation(docId, username, id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[DELETE /api/annotations] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

// Comments sub-resource
export async function PATCH(req: Request) {
  try {
    const repo = getRepository();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId') || searchParams.get('fingerprint') || 'default';
    const username = searchParams.get('username') || searchParams.get('ae_username') || 'unknown';
    const body = (await req.json()) as { action: 'addComment' | 'updateComment' | 'deleteComment'; annotationId?: string; comment?: IAnnotationComment; commentId?: string };
    switch (body.action) {
      case 'addComment': {
        if (!body.annotationId || !body.comment) return NextResponse.json({ error: 'missing_params' }, { status: 400 });
        // Verify scope if needed (omitted here), then add
        const c = await repo.addComment(body.annotationId, body.comment);
        return NextResponse.json(c, { status: 201 });
      }
      case 'updateComment': {
        if (!body.comment) return NextResponse.json({ error: 'missing_comment' }, { status: 400 });
        const c = await repo.updateComment(body.comment);
        return NextResponse.json(c);
      }
      case 'deleteComment': {
        if (!body.commentId) return NextResponse.json({ error: 'missing_comment_id' }, { status: 400 });
        await repo.deleteComment(body.commentId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[PATCH /api/annotations] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
