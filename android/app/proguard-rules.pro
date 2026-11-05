# ProGuard and R8 rules for Hexa Color Quest

# Jetpack Compose rules
-keepclassmembers class * extends androidx.compose.runtime.State { *; }

# Google Mobile Ads SDK rules
-keep public class com.google.android.gms.ads.** {
   public *;
}
-keep public class com.google.ads.** {
   public *;
}

# Keep data models
-keep class com.hexacolor.quest.model.** { *; }
-keep class com.hexacolor.quest.logic.** { *; }
-keep class com.hexacolor.quest.data.** { *; }
-keep class com.hexacolor.quest.ads.** { *; }

# Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
