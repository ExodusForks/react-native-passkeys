const MAX_NATIVE_EXCEPTIONS = 6;
const CLASS_NAME = /^(?:[A-Za-z_$][\w$]*\.)+[A-Za-z_$][\w$]*$/;

type NativeError = Error & {
	userInfo?: { nativeExceptionClasses?: unknown };
};

export async function withNativeExceptionChain<T>(operation: () => T): Promise<Awaited<T>> {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof Error) {
			const classes = (error as NativeError).userInfo?.nativeExceptionClasses;
			if (
				Array.isArray(classes) &&
				classes.length > 0 &&
				classes.every(
					(name) => typeof name === "string" && name.length <= 256 && CLASS_NAME.test(name),
				)
			) {
				error.name = classes[0];
				if (error.cause === undefined) {
					let cause: Error | undefined;
					for (const name of classes.slice(1, MAX_NATIVE_EXCEPTIONS).reverse()) {
						const next = new Error();
						next.name = name;
						if (cause) next.cause = cause;
						cause = next;
					}
					if (cause) error.cause = cause;
				}
			}
		}
		throw error;
	}
}
