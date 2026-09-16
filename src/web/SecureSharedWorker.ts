/**
 * A SharedWorker that is created asynchronously so that its script can be
 * fetched and integrity-verified before it is spawned.
 */
export class SecureSharedWorker extends SharedWorker {

  private constructor(scriptURL: string | URL, options: string | WorkerOptions) {
    super(scriptURL, options);
  }

  static async create(scriptURL: string | URL, integrityHash: string, options: string | WorkerOptions): Promise<SecureSharedWorker> {
    const response = await fetch(scriptURL, { integrity: integrityHash });
    const blobUrl = URL.createObjectURL(new Blob([await response.text()], {type: 'text/javascript'}));
    return new SecureSharedWorker(blobUrl, options);
  }
}
