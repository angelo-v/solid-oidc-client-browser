/**
 * A SharedWorker that is created asynchronously so that its script can be
 * fetched and integrity-verified before it is spawned.
 */
export class SecureSharedWorker extends SharedWorker {

    private constructor(scriptURL: string | URL, options: string | WorkerOptions) {
        super(scriptURL, options);
    }

    /**
     * TODO fetch and verify the script before spawning.
     */
    static async create(scriptURL: string | URL, integrityHash: string, options: string | WorkerOptions): Promise<SecureSharedWorker> {
        return new SecureSharedWorker(scriptURL, options);
    }
}
