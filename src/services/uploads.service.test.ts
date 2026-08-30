import { toFormDataFilePart } from './uploads.service';


describe('toFormDataFilePart', () => {
  it('carries the uri and filename through unchanged', () => {
    const part = toFormDataFilePart({ uri: 'file:///tmp/photo.jpg', fileName: 'photo.jpg', mimeType: 'image/jpeg' }) as unknown as {
      uri: string;
      name: string;
      type: string;
    };

    expect(part.uri).toBe('file:///tmp/photo.jpg');
    expect(part.name).toBe('photo.jpg');
    expect(part.type).toBe('image/jpeg');
  });

  it('falls back to a generic MIME type when none is provided', () => {
    const part = toFormDataFilePart({ uri: 'file:///tmp/doc', fileName: 'doc' }) as unknown as { type: string };

    expect(part.type).toBe('application/octet-stream');
  });

  it('falls back to a generic MIME type for an empty string mimeType too', () => {
    const part = toFormDataFilePart({ uri: 'file:///tmp/doc', fileName: 'doc', mimeType: '' }) as unknown as { type: string };

    expect(part.type).toBe('application/octet-stream');
  });
});
