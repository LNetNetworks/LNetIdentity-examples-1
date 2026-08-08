import 'package:flutter/material.dart';

import '../pwa_install.dart';

/// Botón para instalar la wallet como app en el dispositivo.
///
/// Se muestra solo si hay algo que hacer: en Chrome/Edge cuando el navegador
/// ofreció el diálogo nativo, y en iOS —que no expone esa API— con las
/// instrucciones de "Agregar a inicio". Si ya está instalada, no se dibuja.
class InstallPwaButton extends StatefulWidget {
  const InstallPwaButton({super.key});

  @override
  State<InstallPwaButton> createState() => _InstallPwaButtonState();
}

class _InstallPwaButtonState extends State<InstallPwaButton> {
  bool _installed = isPwaInstalled();
  bool _canPrompt = canPromptPwaInstall();
  final bool _isIos = isIosBrowser();

  @override
  void initState() {
    super.initState();
    // El navegador puede ofrecer el prompt después de que la pantalla ya se
    // dibujó, así que hay que rebuildear cuando eso pasa.
    onPwaInstallChanged(_refresh);
  }

  void _refresh() {
    if (!mounted) return;
    setState(() {
      _installed = isPwaInstalled();
      _canPrompt = canPromptPwaInstall();
    });
  }

  Future<void> _install() async {
    if (_canPrompt) {
      await promptPwaInstall();
      _refresh();
      return;
    }
    if (mounted) _showIosInstructions();
  }

  void _showIosInstructions() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        final theme = Theme.of(context);

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Instalar en tu iPhone',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Safari no permite instalarla automáticamente, pero son tres '
                  'pasos.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                const _IosStep(
                  icon: Icons.ios_share,
                  text: 'Tocá Compartir en la barra de Safari.',
                ),
                const _IosStep(
                  icon: Icons.add_box_outlined,
                  text: 'Elegí "Agregar a inicio".',
                ),
                const _IosStep(
                  icon: Icons.check_circle_outline,
                  text: 'Confirmá con "Agregar".',
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Entendido'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_installed || (!_canPrompt && !_isIos)) return const SizedBox.shrink();

    // El espacio va acá adentro para no dejar un hueco cuando no se dibuja.
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: OutlinedButton.icon(
        onPressed: _install,
        icon: const Icon(Icons.install_mobile, size: 20),
        label: const Text('Instalar app'),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _IosStep extends StatelessWidget {
  const _IosStep({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 22, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
