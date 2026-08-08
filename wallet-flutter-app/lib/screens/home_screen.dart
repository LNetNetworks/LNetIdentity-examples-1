import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../main.dart' show shortenDid;
import '../models.dart';
import '../theme.dart';
import '../wallet_api.dart';
import '../widgets/credential_card.dart';
import 'scan_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.api,
    required this.session,
    required this.onSessionChanged,
    required this.onLogout,
  });

  final WalletApi api;
  final Session session;
  final ValueChanged<Session> onSessionChanged;
  final VoidCallback onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<HolderCredential>? _credentials;
  String? _error;
  bool _loading = false;
  bool _busy = false;

  Session get _session => widget.session;

  @override
  void initState() {
    super.initState();
    if (_session.did != null) _load();
  }

  Future<void> _load() async {
    final did = _session.did;
    if (did == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final credentials = await widget.api.listCredentials(
        _session.accessToken,
        did,
      );
      if (!mounted) return;
      setState(() {
        _credentials = credentials;
        _loading = false;
      });
    } on WalletApiException catch (error) {
      if (!mounted) return;
      if (error.status == 401) {
        _expire();
        return;
      }
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  void _expire() {
    widget.onLogout();
  }

  Future<void> _logout() async {
    try {
      await widget.api.logout(_session);
    } on WalletApiException {
      // Cerrar sesión localmente igual: el token expira solo.
    }
    if (mounted) widget.onLogout();
  }

  Future<void> _createWallet() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Crear wallet'),
        content: const Text(
          'Se va a generar un DID nuevo para tu usuario. Cada vez que se crea '
          'una wallet la API genera un DID distinto, así que hacelo una sola vez.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Crear'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      final did = await widget.api.createWallet(_session.accessToken);
      if (!mounted) return;
      setState(() => _busy = false);
      widget.onSessionChanged(_session.withDid(did));
    } on WalletApiException catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      _snack(error.message, isError: true);
    }
  }

  Future<void> _scanAndPresent() async {
    final credentials = _credentials ?? const <HolderCredential>[];

    final raw = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (context) => const ScanScreen()),
    );
    if (!mounted || raw == null) return;

    final verifierDid = verifierDidFromQr(raw);
    if (verifierDid == null) {
      _snack('El QR no contiene un DID de verificador válido.', isError: true);
      return;
    }

    // Sin credenciales no hay nada que elegir, pero igual se abre el diálogo:
    // el ID se escribe a mano para probar contra la API.
    HolderCredential? credential;
    if (credentials.length == 1) {
      credential = credentials.first;
    } else if (credentials.length > 1) {
      credential = await _pickCredential(credentials, verifierDid);
      if (!mounted || credential == null) return;
    }

    final credentialId = await showDialog<String>(
      context: context,
      builder: (context) => _PresentDialog(
        credential: credential,
        verifierDid: verifierDid,
      ),
    );
    if (!mounted || credentialId == null) return;

    await _present(verifierDid, credential, credentialId);
  }

  Future<HolderCredential?> _pickCredential(
    List<HolderCredential> credentials,
    String verifierDid,
  ) {
    return showModalBottomSheet<HolderCredential>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '¿Qué credencial querés presentar?',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                'Verificador ${shortenDid(verifierDid)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: credentials.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => CredentialCard(
                    credential: credentials[index],
                    onTap: () =>
                        Navigator.of(context).pop(credentials[index]),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _present(
    String verifierDid,
    HolderCredential? credential,
    String credentialId,
  ) async {
    setState(() => _busy = true);

    try {
      final message = await widget.api.shareVerify(
        accessToken: _session.accessToken,
        receiverDid: verifierDid,
        holderDid: _session.did!,
        credentialId: credentialId,
      );
      if (!mounted) return;
      setState(() => _busy = false);
      await _showSuccess(message, verifierDid, credential, credentialId);
    } on WalletApiException catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      _snack(_presentErrorMessage(error), isError: true);
    }
  }

  /// La API devuelve mensajes internos (`ERR_CREDENTIAL_VERIFY: Type error:
  /// undefined`) que no sirven para mostrar tal cual.
  String _presentErrorMessage(WalletApiException error) {
    switch (error.status) {
      case 403:
        return 'Tu usuario no tiene permisos para presentar credenciales.';
      case 404:
        return 'No se encontró la credencial o el verificador del QR.';
      case 422:
        return 'La credencial no es válida y no pudo presentarse.';
      default:
        return error.status == 0
            ? error.message
            : 'No se pudo presentar la credencial (${error.status}).';
    }
  }

  Future<void> _showSuccess(
    String message,
    String verifierDid,
    HolderCredential? credential,
    String credentialId,
  ) {
    final theme = Theme.of(context);
    return showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        icon: Container(
          width: 64,
          height: 64,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.check_rounded,
            size: 36,
            color: theme.colorScheme.onPrimaryContainer,
          ),
        ),
        title: const Text('¡Credencial presentada!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            if (credential != null)
              _SummaryRow(label: 'Credencial', value: credential.displayType),
            _SummaryRow(
              label: 'Verificador',
              value: shortenDid(verifierDid),
            ),
            if (credentialId != credential?.id)
              _SummaryRow(label: 'ID enviado', value: credentialId),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Listo'),
          ),
        ],
      ),
    );
  }

  Future<void> _showDetail(HolderCredential credential) async {
    final did = _session.did;
    if (did == null) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        builder: (context, scrollController) => FutureBuilder<
            Map<String, dynamic>>(
          future: widget.api.credentialDetail(
            _session.accessToken,
            did,
            credential.id,
          ),
          builder: (context, snapshot) {
            final Widget body;
            if (snapshot.connectionState == ConnectionState.waiting) {
              body = const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              body = Center(
                child: Text('No se pudo cargar el detalle.\n${snapshot.error}'),
              );
            } else {
              body = SingleChildScrollView(
                controller: scrollController,
                child: SelectableText(
                  const JsonEncoder.withIndent('  ').convert(snapshot.data),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                ),
              );
            }

            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    credential.displayType,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Expanded(child: body),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _snack(String message, {bool isError = false}) {
    final theme = Theme.of(context);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor: isError ? theme.colorScheme.error : null,
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final hasWallet = _session.did != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis credenciales'),
        actions: [
          IconButton(
            tooltip: 'Cerrar sesión',
            onPressed: _busy ? null : _logout,
            icon: const Icon(Icons.logout),
          ),
          const SizedBox(width: 4),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: hasWallet
          ? FloatingActionButton.large(
              onPressed: _busy ? null : _scanAndPresent,
              tooltip: 'Escanear QR para presentar una credencial',
              shape: const CircleBorder(),
              child: const Icon(Icons.qr_code_scanner, size: 34),
            )
          : null,
      body: Stack(
        children: [
          Column(
            children: [
              _DidHeader(session: _session),
              Expanded(
                child: hasWallet ? _buildList() : _buildNoWallet(),
              ),
            ],
          ),
          if (_busy)
            const ColoredBox(
              color: Color(0x66000000),
              child: Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _buildList() {
    if (_loading && _credentials == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _EmptyState(
        icon: Icons.cloud_off_outlined,
        title: 'No se pudieron cargar tus credenciales',
        message: _error!,
        action: FilledButton.tonal(
          onPressed: _load,
          child: const Text('Reintentar'),
        ),
      );
    }

    final credentials = _credentials ?? const <HolderCredential>[];
    if (credentials.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: [
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.5,
              child: const _EmptyState(
                icon: Icons.credit_card_off_outlined,
                title: 'Todavía no tenés credenciales',
                message:
                    'Cuando un emisor te emita una credencial a este DID, va a '
                    'aparecer acá.',
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        itemCount: credentials.length,
        separatorBuilder: (_, _) => const SizedBox(height: 14),
        itemBuilder: (context, index) => CredentialCard(
          credential: credentials[index],
          onTap: () => _showDetail(credentials[index]),
        ),
      ),
    );
  }

  Widget _buildNoWallet() {
    return _EmptyState(
      icon: Icons.account_balance_wallet_outlined,
      title: 'Tu usuario no tiene una wallet',
      message:
          'El login no devolvió un DID. Creá una wallet para empezar a recibir '
          'credenciales.',
      action: FilledButton(
        onPressed: _busy ? null : _createWallet,
        child: const Text('Crear wallet'),
      ),
    );
  }
}

/// Confirmación previa al envío: devuelve por `pop` el ID a presentar, o `null`
/// si se cancela.
///
/// El ID llega bloqueado con el de la credencial elegida y el lápiz lo habilita
/// para editarlo, así se puede probar la API con IDs inexistentes, de otro
/// holder o mal formados sin tocar el código. Con `credential` en null (la
/// wallet no tiene credenciales) arranca vacío y ya editable.
class _PresentDialog extends StatefulWidget {
  const _PresentDialog({required this.credential, required this.verifierDid});

  final HolderCredential? credential;
  final String verifierDid;

  @override
  State<_PresentDialog> createState() => _PresentDialogState();
}

class _PresentDialogState extends State<_PresentDialog> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.credential?.id ?? '',
  );
  late bool _editing = widget.credential == null;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String get _id => _controller.text.trim();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final credential = widget.credential;

    return AlertDialog(
      title: const Text('Presentar credencial'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (credential != null)
            _SummaryRow(
              label: 'Credencial',
              value: credential.displayType,
            ),
          _SummaryRow(
            label: 'Verificador',
            value: shortenDid(widget.verifierDid),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 92,
                child: Text(
                  'ID',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              Expanded(
                child: _editing
                    ? TextField(
                        controller: _controller,
                        autofocus: true,
                        onChanged: (_) => setState(() {}),
                        decoration: const InputDecoration(
                          isDense: true,
                          border: OutlineInputBorder(),
                          hintText: 'ID de la credencial',
                        ),
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 12,
                        ),
                      )
                    : Text(
                        _controller.text,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontFamily: 'monospace',
                        ),
                      ),
              ),
              // Sin credencial elegida no hay ID original al que volver.
              if (credential != null)
                IconButton(
                  tooltip: _editing
                      ? 'Restaurar el ID original'
                      : 'Editar el ID (pruebas)',
                  icon: Icon(
                    _editing ? Icons.undo_rounded : Icons.edit_outlined,
                    size: 18,
                  ),
                  onPressed: () => setState(() {
                    if (_editing) _controller.text = credential.id;
                    _editing = !_editing;
                  }),
                ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _id.isEmpty
              ? null
              : () => Navigator.of(context).pop(_id),
          child: const Text('Presentar'),
        ),
      ],
    );
  }
}

/// Cabecera con el usuario y el DID de la wallet.
class _DidHeader extends StatelessWidget {
  const _DidHeader({required this.session});

  final Session session;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final did = session.did;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
      decoration: const BoxDecoration(
        gradient: kBrandGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: Colors.white24,
                child: Text(
                  session.username.isEmpty
                      ? '?'
                      : session.username.characters.first.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      session.username,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Holder',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.badge_outlined, color: Colors.white, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DID',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: Colors.white70,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Tooltip(
                        message: did ?? '',
                        child: Text(
                          did == null ? 'Sin wallet' : shortenDid(did),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'monospace',
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (did != null)
                  IconButton(
                    tooltip: 'Copiar DID',
                    icon: const Icon(
                      Icons.copy_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                    onPressed: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      await Clipboard.setData(ClipboardData(text: did));
                      messenger
                        ..hideCurrentSnackBar()
                        ..showSnackBar(
                          const SnackBar(
                            content: Text('DID copiado'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
}
