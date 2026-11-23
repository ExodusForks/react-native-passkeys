import { NativeModules, Platform } from 'react-native';

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "./ReactNativePasskeys.types";
import { withNativeExceptionChain } from "./native-errors";

const LINKING_ERROR =
  `The package 'react-native-passkeys' doesn't seem to be linked. Make sure: \n\n${Platform.select({ ios: "- You have run 'pod install'\n", default: '' })}- You rebuilt the app after installing the package\n- You are not using Expo Go\n`;

const passkeys = NativeModules.ReactNativePasskeys

const ReactNativePasskeys = passkeys
  ? {
    isSupported: passkeys.isSupported.bind(passkeys),
    isAutoFillAvailable: passkeys.isAutoFillAvailable?.bind(passkeys),
    get: (request: PublicKeyCredentialRequestOptionsJSON) =>
      withNativeExceptionChain(() => passkeys.get(request)),
    async create(
      request: PublicKeyCredentialCreationOptionsJSON,
    ): Promise<RegistrationResponseJSON | null> {
      const credential = await withNativeExceptionChain(
        () => passkeys.create(request),
      );
      return {
        ...credential,
        response: {
          ...credential.response,
          getPublicKey() {
            return credential.response?.publicKey;
          },
        },
      };
    },
  }
  : (new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  ) as any);

export default ReactNativePasskeys
