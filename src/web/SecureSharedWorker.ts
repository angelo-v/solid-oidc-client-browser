/**
 * A SharedWorker that is created asynchronously so that its script can be
 * fetched and integrity-verified before it is spawned.
 */
export class SecureSharedWorker extends SharedWorker {

  private constructor(scriptURL: string | URL, options: WorkerOptions) {
    super(scriptURL, options);
  }

  static async create(scriptURL: string | URL, integrityHash: string, options: WorkerOptions): Promise<SecureSharedWorker> {
    const storageKey = this.getStorageKey(scriptURL);
    const existingUrl = localStorage.getItem(storageKey);

    if (existingUrl) {
      return new SecureSharedWorker(existingUrl, options);
    }
    const blobUrl = await this.fetchWorkerScript(scriptURL, integrityHash);
    return new SecureSharedWorker(blobUrl, options);
  }

  private static getStorageKey(scriptURL: string | URL) {
    return `secure-shared-worker:${scriptURL}`;
  }

  private static async fetchWorkerScript(scriptURL: string | URL, integrityHash: string) {
    const response = await fetch(scriptURL, {integrity: integrityHash});
    const blobUrl = URL.createObjectURL(new Blob([await response.text()], {type: 'text/javascript'}));
    localStorage.setItem(this.getStorageKey(scriptURL), blobUrl);
    return blobUrl;
  }
}
