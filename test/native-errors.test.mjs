import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withNativeExceptionChain } from '../build/native-errors.js';

for (const operation of ['Create', 'Get']) {
  test(`preserves the native ${operation.toLowerCase()} exception and its causes`, async () => {
    const name = `androidx.credentials.exceptions.${operation}CredentialUnknownException`;
    const error = Object.assign(new Error('UnknownError: '), {
      code: `Passkey ${operation}`,
      userInfo: {
        nativeExceptionClasses: [
          name,
          'com.google.android.gms.common.api.ApiException',
          'java.lang.IllegalStateException',
        ],
        message: 'private credential data',
      },
    });

    await assert.rejects(withNativeExceptionChain(() => Promise.reject(error)), (caught) => {
      assert.equal(caught, error);
      assert.equal(caught.name, name);
      assert.equal(caught.message, 'UnknownError: ');
      assert.equal(caught.code, `Passkey ${operation}`);
      assert.ok(caught.cause instanceof Error);
      assert.equal(caught.cause.name, 'com.google.android.gms.common.api.ApiException');
      assert.equal(caught.cause.message, '');
      assert.equal(caught.cause.cause.name, 'java.lang.IllegalStateException');
      assert.equal(caught.cause.cause.message, '');
      assert.equal(caught.cause.cause.cause, undefined);
      return true;
    });
  });
}

test('preserves successful credentials', async () => {
  const credential = { id: 'credential' };
  assert.equal(await withNativeExceptionChain(() => Promise.resolve(credential)), credential);
});

test('leaves iOS, cancellation, and other errors without native metadata unchanged', async () => {
  for (const error of [new Error('USER_CANCELLED'), new Error('iOS failure'), null, 'failure']) {
    await assert.rejects(withNativeExceptionChain(() => Promise.reject(error)), (caught) => {
      assert.equal(caught, error);
      if (caught instanceof Error) assert.equal(caught.cause, undefined);
      return true;
    });
  }
});

test('ignores malformed metadata without replacing the original rejection', async () => {
  for (const nativeExceptionClasses of [null, 'java.lang.Error', [], ['private data'], [1]]) {
    const error = Object.assign(new Error('UnknownError: '), {
      userInfo: { nativeExceptionClasses },
    });
    await assert.rejects(withNativeExceptionChain(() => Promise.reject(error)), (caught) => {
      assert.equal(caught, error);
      assert.equal(caught.name, 'Error');
      assert.equal(caught.cause, undefined);
      return true;
    });
  }
});

test('bounds native causes to the five supported by Safe Reports', async () => {
  const error = Object.assign(new Error(), {
    userInfo: { nativeExceptionClasses: Array(20).fill('java.lang.IllegalStateException') },
  });
  await assert.rejects(withNativeExceptionChain(() => Promise.reject(error)), (caught) => {
    let count = 0;
    for (let current = caught.cause; current; current = current.cause) count++;
    assert.equal(count, 5);
    return true;
  });
});

test('preserves an existing JavaScript cause', async () => {
  const cause = new Error('existing cause');
  const error = Object.assign(new Error('UnknownError: ', { cause }), {
    userInfo: { nativeExceptionClasses: ['java.lang.Error', 'java.lang.RuntimeException'] },
  });
  await assert.rejects(withNativeExceptionChain(() => Promise.reject(error)), (caught) => {
    assert.equal(caught.cause, cause);
    return true;
  });
});
