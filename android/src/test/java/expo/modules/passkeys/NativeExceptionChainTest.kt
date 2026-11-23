package expo.modules.passkeys

import androidx.credentials.exceptions.CreateCredentialUnknownException
import androidx.credentials.exceptions.GetCredentialUnknownException
import java.io.IOException
import org.junit.Assert.assertEquals
import org.junit.Test

class NativeExceptionChainTest {
  @Test
  fun exportsCreateAndGetExceptionClassesWithoutMessages() {
    for (error in listOf(
      CreateCredentialUnknownException("private create request"),
      GetCredentialUnknownException("private get request")
    )) {
      error.initCause(IllegalStateException("private account", IOException("private credential")))

      assertEquals(
        listOf(error.javaClass.name, "java.lang.IllegalStateException", "java.io.IOException"),
        nativeExceptionClasses(error)
      )
    }
  }

  @Test
  fun boundsDeepChains() {
    var error: Throwable = IOException("private credential")
    repeat(10) { error = IllegalStateException("private account", error) }

    assertEquals(List(6) { "java.lang.IllegalStateException" }, nativeExceptionClasses(error))
  }

  @Test
  fun stopsAtCycles() {
    val first = IllegalStateException("private account")
    val second = IOException("private credential")
    first.initCause(second)
    second.initCause(first)

    assertEquals(
      listOf("java.lang.IllegalStateException", "java.io.IOException"),
      nativeExceptionClasses(first)
    )
  }
}
