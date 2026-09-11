export class SecureSharedWorker extends SharedWorker {

  constructor(scriptURL: string | URL, integrityHash: string, options: string | WorkerOptions) {
    super(scriptURL, options);
  }
}