import 'package:flutter/material.dart';

import 'models.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'theme.dart';
import 'wallet_api.dart';

void main() {
  runApp(const WalletApp());
}

class WalletApp extends StatefulWidget {
  const WalletApp({super.key});

  @override
  State<WalletApp> createState() => _WalletAppState();
}

class _WalletAppState extends State<WalletApp> {
  final WalletApi _api = WalletApi();
  Session? _session;

  @override
  Widget build(BuildContext context) {
    final session = _session;

    return MaterialApp(
      title: 'Wallet Holder',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: session == null
          ? LoginScreen(
              api: _api,
              onLoggedIn: (value) => setState(() => _session = value),
            )
          : HomeScreen(
              // La key hace que un login distinto reconstruya el estado en vez
              // de reutilizar las credenciales ya cargadas.
              key: ValueKey(session.did ?? session.username),
              api: _api,
              session: session,
              onSessionChanged: (value) => setState(() => _session = value),
              onLogout: () => setState(() => _session = null),
            ),
    );
  }
}

/// Acorta un DID largo para mostrarlo: `did:lac:openprotest:0x31ac…49fc`.
String shortenDid(String did, {int head = 6, int tail = 4}) {
  final index = did.lastIndexOf(':');
  if (index == -1 || index == did.length - 1) return did;

  final prefix = did.substring(0, index + 1);
  final id = did.substring(index + 1);
  if (id.length <= head + tail + 1) return did;

  return '$prefix${id.substring(0, head)}…${id.substring(id.length - tail)}';
}
