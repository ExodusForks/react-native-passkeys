package expo.modules.passkeys

import java.util.Collections
import java.util.IdentityHashMap

internal fun nativeExceptionClasses(error: Throwable): List<String> {
  val classes = mutableListOf<String>()
  val seen = Collections.newSetFromMap(IdentityHashMap<Throwable, Boolean>())
  var current: Throwable? = error

  // Safe Reports retain the original exception and at most five linked causes.
  while (current != null && classes.size < 6 && seen.add(current)) {
    classes.add(current.javaClass.name)
    current = current.cause
  }

  return classes
}
