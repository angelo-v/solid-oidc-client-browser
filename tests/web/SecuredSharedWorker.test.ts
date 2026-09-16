(global as any).SharedWorker = jest.fn();

import {SecureSharedWorker} from "../../src/web/SecureSharedWorker";
import {randomUUID} from 'crypto';

const WORKER_SCRIPT = 'self.onmessage = () => {};';
URL.createObjectURL = jest.fn(() => `blob:https://app.test/${randomUUID()}`);

describe('SecuredSharedWorker', () => {

  beforeEach(() => {
    localStorage.clear();
    (SharedWorker as jest.Mock).mockClear();
    (URL.createObjectURL as jest.Mock).mockClear();
    (fetch as jest.Mock).mockClear();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(WORKER_SCRIPT),
    });
  });

  const mintedBlobUrl = () => (URL.createObjectURL as jest.Mock).mock.results[0].value as string;

  it('fetches the worker script with integrity check', async () => {
    // when a SecureSharedWorker is created with a script URL and integrity hash
    await SecureSharedWorker.create("https://cdn.example/worker.js", "fake-hash-123", { type: 'module' });

    // then the script is fetched using an integrity check
    expect(fetch).toHaveBeenCalledWith("https://cdn.example/worker.js", { integrity: "fake-hash-123" });
  });

  it('spawns a SharedWorker with a blob URL built from the fetched script', async () => {
    // when the SecureSharedWorker is created
    await SecureSharedWorker.create("https://cdn.example/worker.js", "fake-hash-123", { type: 'module' });

    // then the fetched script is used to create a freshly minted blob URL
    const blobUrl = mintedBlobUrl();
    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/javascript');
    expect(await new Response(blob).text()).toBe(WORKER_SCRIPT);

    // and the SharedWorker is created with that blob URL
    expect(SharedWorker).toHaveBeenCalledWith(blobUrl, { type: 'module' });
  });

  it('connects to an existing shared worker re-using the same blob URL', async () => {
    // given a first tab fetched the script and spawned the worker from its blob URL
    await SecureSharedWorker.create("https://cdn.example/worker.js", "fake-hash-123", { type: 'module' });
    const firstTabBlobUrl = mintedBlobUrl();
    expect(fetch).toHaveBeenCalledTimes(1);

    // when a second tab creates a SecureSharedWorker for the same script
    (SharedWorker as jest.Mock).mockClear();
    (fetch as jest.Mock).mockClear();
    (URL.createObjectURL as jest.Mock).mockClear();
    await SecureSharedWorker.create("https://cdn.example/worker.js", "fake-hash-123", { type: 'module' });

    // then it connects via the SAME blob URL — no fetch, no new blob URL
    expect(fetch).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(SharedWorker).toHaveBeenCalledWith(firstTabBlobUrl, { type: 'module' });
  });

  it('does not re-use the blob URL if a different worker script is used', async () => {
    // given a first tab fetched the script and spawned the worker from its blob URL
    await SecureSharedWorker.create("https://cdn.example/worker1.js", "fake-hash-1", { type: 'module' });
    const firstTabBlobUrl = mintedBlobUrl();
    expect(fetch).toHaveBeenCalledTimes(1);

    // when a second tab creates a SecureSharedWorker for a different script
    (SharedWorker as jest.Mock).mockClear();
    (fetch as jest.Mock).mockClear();
    (URL.createObjectURL as jest.Mock).mockClear();
    await SecureSharedWorker.create("https://cdn.example/worker2.js", "fake-hash-2", { type: 'module' });

    // then it fetches the other script and connects a new worker to a new blob URL
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalled();
    const secondTabBlobUrl = mintedBlobUrl();
    expect(SharedWorker).toHaveBeenCalledWith(secondTabBlobUrl, { type: 'module' });
    expect(firstTabBlobUrl).not.toBe(secondTabBlobUrl);
  });
});
