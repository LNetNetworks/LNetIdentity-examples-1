import 'dart:convert';

/// Sesión del holder: lo que devuelve `POST /login` más lo que se puede leer
/// del propio access token.
class Session {
  const Session({
    required this.accessToken,
    required this.refreshToken,
    required this.did,
    required this.expiresAt,
    required this.username,
    required this.roles,
  });

  final String accessToken;
  final String? refreshToken;

  /// DID de la wallet del usuario. `POST /login` sólo lo devuelve si el usuario
  /// ya tiene una wallet creada; si no, queda en null y hay que crearla.
  final String? did;

  final DateTime? expiresAt;
  final String username;
  final List<String> roles;

  bool get isExpired =>
      expiresAt != null && !expiresAt!.isAfter(DateTime.now());

  bool get isHolder => roles.contains('holder');

  Session withDid(String newDid) => Session(
    accessToken: accessToken,
    refreshToken: refreshToken,
    did: newDid,
    expiresAt: expiresAt,
    username: username,
    roles: roles,
  );

  factory Session.fromTokenResponse(Map<String, dynamic> json) {
    final accessToken = json['access_token'] as String;
    final payload = decodeJwtPayload(accessToken);

    // El `exp` del propio token le gana a `expires_in`, que es relativo a un
    // round-trip cuya duración no conocemos.
    final exp = payload?['exp'];
    final expiresIn = json['expires_in'];
    final DateTime? expiresAt = exp is num
        ? DateTime.fromMillisecondsSinceEpoch((exp * 1000).toInt())
        : expiresIn is num
        ? DateTime.now().add(Duration(seconds: expiresIn.toInt()))
        : null;

    return Session(
      accessToken: accessToken,
      refreshToken: json['refresh_token'] as String?,
      did: json['did'] as String?,
      expiresAt: expiresAt,
      username: (payload?['preferred_username'] as String?) ?? '',
      roles: payload == null ? const [] : rolesFrom(payload),
    );
  }
}

/// Lee el payload de un JWT **sin validar la firma**: se usa sólo para pintar
/// la UI. Toda decisión de autorización real la toma la API, que valida el
/// token en cada llamada.
Map<String, dynamic>? decodeJwtPayload(String token) {
  final segments = token.split('.');
  if (segments.length != 3) return null;
  try {
    final json = utf8.decode(base64Url.decode(base64Url.normalize(segments[1])));
    final decoded = jsonDecode(json);
    return decoded is Map<String, dynamic> ? decoded : null;
  } catch (_) {
    return null;
  }
}

/// Los roles de Keycloak viven repartidos entre `realm_access` y
/// `resource_access[<client>]`. Este deployment pone los interesantes bajo el
/// cliente `d-wallet-cli`, pero se juntan de todos los clientes para que el
/// chequeo siga funcionando si se apunta a otro cliente.
List<String> rolesFrom(Map<String, dynamic> payload) {
  final roles = <String>{};

  void addAll(dynamic value) {
    if (value is List) {
      for (final role in value) {
        if (role is String) roles.add(role.toLowerCase());
      }
    }
  }

  final realmAccess = payload['realm_access'];
  if (realmAccess is Map) addAll(realmAccess['roles']);

  final resourceAccess = payload['resource_access'];
  if (resourceAccess is Map) {
    for (final client in resourceAccess.values) {
      if (client is Map) addAll(client['roles']);
    }
  }

  return roles.toList();
}

/// `CredentialSummaryHolder` del OpenAPI: lo que devuelve `GET /holder/{did}`.
class HolderCredential {
  const HolderCredential({required this.id, this.didIssuer, this.type});

  final String id;
  final String? didIssuer;
  final String? type;

  String get displayType {
    final value = type;
    if (value == null || value.isEmpty) return 'Credencial verificable';
    // "UniversityDegreeCredential" -> "University Degree Credential"
    return value
        .replaceAllMapped(
          RegExp(r'(?<=[a-z0-9])(?=[A-Z])'),
          (match) => ' ',
        )
        .trim();
  }

  factory HolderCredential.fromJson(Map<String, dynamic> json) =>
      HolderCredential(
        id: (json['id'] ?? '').toString(),
        didIssuer: json['did_issuer'] as String?,
        type: json['type'] as String?,
      );
}
