import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

/// El documento OpenAPI declara `/wallet` como base path del server, así que
/// forma parte de la URL. Se puede sobreescribir con
/// `--dart-define=IDENTITY_API_BASE_URL=...`.
const String apiBaseUrl = String.fromEnvironment(
  'IDENTITY_API_BASE_URL',
  defaultValue: 'https://dev-identity-dwallet.l-net.io/wallet',
);

/// `APIError` del OpenAPI, más el status HTTP real.
class WalletApiException implements Exception {
  WalletApiException(this.message, this.status, [this.code]);

  final String message;
  final int status;
  final int? code;

  /// La spec documenta 401 para credenciales inválidas, pero el deployment
  /// devuelve 500 con `ERR_KEYCLOAK_GENERATE_TOKEN: ... Invalid user
  /// credentials`. Hay que contemplar los dos.
  bool get isBadCredentials =>
      status == 401 || message.contains('Invalid user credentials');

  @override
  String toString() => message;
}

class WalletApi {
  WalletApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String path) => Uri.parse('$apiBaseUrl$path');

  Map<String, String> _headers(String? accessToken) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (accessToken != null) 'Authorization': 'Bearer $accessToken',
  };

  Future<dynamic> _send(
    String method,
    String path, {
    String? accessToken,
    Object? body,
  }) async {
    late final http.Response response;
    try {
      final request = http.Request(method, _uri(path))
        ..headers.addAll(_headers(accessToken));
      if (body != null) request.body = jsonEncode(body);
      response = await http.Response.fromStream(await _client.send(request));
    } catch (_) {
      throw WalletApiException(
        'No se pudo contactar al servicio de identidad.',
        0,
      );
    }

    final raw = response.body;
    dynamic decoded;
    try {
      decoded = raw.isEmpty ? null : jsonDecode(raw);
    } catch (_) {
      decoded = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final error = decoded is Map<String, dynamic> ? decoded : const {};
    throw WalletApiException(
      (error['message'] as String?) ??
          'La API respondió ${response.statusCode}.',
      (error['status'] as num?)?.toInt() ?? response.statusCode,
      (error['code'] as num?)?.toInt(),
    );
  }

  /// `POST /login` — canjea usuario y contraseña por el par de tokens.
  Future<Session> login(String user, String password) async {
    final json = await _send(
      'POST',
      '/login',
      body: {'user': user, 'password': password},
    );
    return Session.fromTokenResponse(json as Map<String, dynamic>);
  }

  /// `POST /logout` — invalida el refresh token del lado del servidor.
  Future<void> logout(Session session) async {
    final refreshToken = session.refreshToken;
    if (refreshToken == null) return;
    await _send(
      'POST',
      '/logout',
      accessToken: session.accessToken,
      body: {'refresh_token': refreshToken},
    );
  }

  /// `POST /` — crea una wallet DID nueva.
  ///
  /// **No es idempotente**: cada llamada genera un DID distinto. Sólo se invoca
  /// desde una acción explícita del usuario, nunca automáticamente al entrar.
  /// El DID que después devuelve `POST /login` es el de la primera wallet.
  Future<String> createWallet(String accessToken) async {
    final json = await _send('POST', '/', accessToken: accessToken);
    final did = (json as Map<String, dynamic>)['did'] as String?;
    if (did == null) {
      throw WalletApiException('La API no devolvió un DID.', 0);
    }
    return did;
  }

  /// `GET /holder/{did}` — las credenciales del holder.
  Future<List<HolderCredential>> listCredentials(
    String accessToken,
    String did,
  ) async {
    final json = await _send(
      'GET',
      '/holder/${Uri.encodeComponent(did)}',
      accessToken: accessToken,
    );
    if (json is! List) return const [];
    return json
        .whereType<Map<String, dynamic>>()
        .map(HolderCredential.fromJson)
        .toList();
  }

  /// `GET /holder/{did}/id/{id}` — el VC completo (objeto W3C).
  Future<Map<String, dynamic>> credentialDetail(
    String accessToken,
    String did,
    String id,
  ) async {
    final json = await _send(
      'GET',
      '/holder/${Uri.encodeComponent(did)}/id/${Uri.encodeComponent(id)}',
      accessToken: accessToken,
    );
    if (json is Map<String, dynamic>) return json;
    if (json is List && json.isNotEmpty && json.first is Map<String, dynamic>) {
      return json.first as Map<String, dynamic>;
    }
    return const {};
  }

  /// `POST /shareverify/{did}` — verifica la credencial y la presenta al
  /// verifier. `receiverDid` es el DID que viene en el QR.
  ///
  /// Devuelve el mensaje de `ShareVCResponse`.
  Future<String> shareVerify({
    required String accessToken,
    required String receiverDid,
    required String holderDid,
    required String credentialId,
  }) async {
    final json = await _send(
      'POST',
      '/shareverify/${Uri.encodeComponent(receiverDid)}',
      accessToken: accessToken,
      body: {'did_holder': holderDid, 'id_vc': credentialId},
    );
    final message = json is Map<String, dynamic>
        ? json['message'] as String?
        : null;
    return message ?? 'Credencial presentada correctamente.';
  }
}

/// Extrae el DID del verifier del contenido de un QR.
///
/// El QR del portal verifier trae la URL de presentación, con el DID como
/// último segmento del path:
/// `http://host/wallet/shareverify/did:lac:openprotest:0x1975...`
///
/// También se acepta un DID pelado, por si el QR trae sólo eso.
String? verifierDidFromQr(String? rawValue) {
  final raw = rawValue?.trim();
  if (raw == null || raw.isEmpty) return null;

  if (raw.startsWith('did:')) return raw;

  final uri = Uri.tryParse(raw);
  if (uri == null) return null;

  // `Uri` parte el path por "/", pero el DID no contiene "/", así que alcanza
  // con quedarse con el último segmento no vacío y desescaparlo.
  final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
  if (segments.isEmpty) return null;

  final last = Uri.decodeComponent(segments.last);
  return last.startsWith('did:') ? last : null;
}
