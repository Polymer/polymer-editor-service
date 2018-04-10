import {Duplex} from 'stream';
import {CancellationToken} from 'vscode-jsonrpc';
import {createConnection} from 'vscode-languageserver';
import {InitializeParams, InitializeRequest} from 'vscode-languageserver-protocol';
import URI from 'vscode-uri';

class TestStream extends Duplex {
  _write(chunk: string, _encoding: string, done: () => void) {
    this.emit('data', chunk);
    done();
  }

  _read(_size: number) {
  }
}

suite('vscode languageserver initialization', () => {

  test.only('works', async() => {
    const up = new TestStream();
    const down = new TestStream();
    const serverConnection = createConnection(up, down);
    const clientConnection = createConnection(down, up);
    serverConnection.listen();
    clientConnection.listen();

    const init: InitializeParams = {
      rootUri: URI.file(process.cwd()).toString(),
      processId: 1,
      capabilities: {},
      workspaceFolders: null,
    };
    await clientConnection.sendRequest(InitializeRequest.type, init);
  });

});
