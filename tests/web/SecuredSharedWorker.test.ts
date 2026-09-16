(global as any).SharedWorker = jest.fn();

import {SecureSharedWorker} from "../../src/web/SecureSharedWorker";

const WORKER_SCRIPT = 'self.onmessage = () => {};';
URL.createObjectURL = jest.fn();

describe('SecuredSharedWorker', () => {

  beforeEach(() => {
    (SharedWorker as jest.Mock).mockClear();
    (URL.createObjectURL as jest.Mock).mockClear();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(WORKER_SCRIPT),
    });
  });

  it('fetches the worker script with integrity check', async () => {
    // when a SecureSharedWorker is created with a script URL and integrity hash
    await SecureSharedWorker.create("https://cdn.example/worker.js", "fake-hash-123", {type: 'module'});

    // then the script is fetched using an integrity check
    expect(fetch).toHaveBeenCalledWith("https://cdn.example/worker.js", {integrity: "fake-hash-123"});
  });

  it('spawns a SharedWorker with a blob URL built from the fetched script', async () => {
    // given createObjectURL returns a blob URL
    (URL.createObjectURL as jest.Mock).mockReturnValue('blob:https://app.test/aa66e4ff-542d-4dd1-8358-acfee63174a5');

    // when the SecureSharedWorker is created
    await SecureSharedWorker.create("https://cdn.example/worker.js", "fake-hash-123", {type: 'module'});

    // then the fetched is used to create the blob URL
    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/javascript');
    expect(await new Response(blob).text()).toBe(WORKER_SCRIPT);

    // and the SharedWorker is created with that blob URL
    expect(SharedWorker).toHaveBeenCalledWith('blob:https://app.test/aa66e4ff-542d-4dd1-8358-acfee63174a5', {type: 'module'});
  });
});
