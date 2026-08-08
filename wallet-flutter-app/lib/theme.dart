import 'package:flutter/material.dart';

/// Paleta azul sobre negro.
const Color kBlue = Color(0xFF3B7BFF);
const Color kBlueBright = Color(0xFF5B9BFF);
const Color kBlueDeep = Color(0xFF1B47B8);
const Color kBlack = Color(0xFF05070E);
const Color kSurface = Color(0xFF0D1220);
const Color kSurfaceHigh = Color(0xFF141B2D);
const Color kOutline = Color(0xFF222B41);

/// Degradé de marca: azul cayendo a negro azulado.
const LinearGradient kBrandGradient = LinearGradient(
  colors: [kBlue, kBlueDeep, Color(0xFF080D1A)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

ThemeData buildAppTheme() {
  const scheme = ColorScheme.dark(
    primary: kBlue,
    onPrimary: Colors.white,
    primaryContainer: Color(0xFF14264C),
    onPrimaryContainer: kBlueBright,
    secondary: kBlueBright,
    onSecondary: kBlack,
    tertiary: kBlueDeep,
    onTertiary: Colors.white,
    surface: kSurface,
    onSurface: Color(0xFFE8ECF6),
    onSurfaceVariant: Color(0xFF98A3BC),
    surfaceContainerHighest: kSurfaceHigh,
    outline: Color(0xFF3A455E),
    outlineVariant: kOutline,
    error: Color(0xFFFF6B6B),
    onError: Colors.white,
    errorContainer: Color(0xFF3A1418),
    onErrorContainer: Color(0xFFFFB4AB),
  );

  return ThemeData(
    colorScheme: scheme,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: kBlack,
    appBarTheme: const AppBarTheme(
      backgroundColor: kBlack,
      foregroundColor: Color(0xFFE8ECF6),
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      color: kSurface,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: kOutline),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: kSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: kOutline),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: kSurface,
      surfaceTintColor: Colors.transparent,
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: kSurfaceHigh,
      contentTextStyle: TextStyle(color: Color(0xFFE8ECF6)),
      behavior: SnackBarBehavior.floating,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: kBlue,
      foregroundColor: Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kSurfaceHigh,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kOutline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kOutline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kBlue, width: 1.6),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: kBlue,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: kBlue),
  );
}
