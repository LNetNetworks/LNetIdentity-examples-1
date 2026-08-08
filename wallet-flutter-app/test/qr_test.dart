import 'package:flutter_test/flutter_test.dart';
import 'package:wallet_holder/main.dart' show shortenDid;
import 'package:wallet_holder/models.dart';
import 'package:wallet_holder/wallet_api.dart';

void main() {
  group('verifierDidFromQr', () {
    const did = 'did:lac:openprotest:0x1975b634ce9c320b251e8c27314e5c2c2535ed9d';

    test('extrae el DID de la URL de shareverify', () {
      expect(
        verifierDidFromQr(
          'http://dev-identity-dwallet.l-net.io/wallet/shareverify/$did',
        ),
        did,
      );
    });

    test('acepta https y espacios alrededor', () {
      expect(
        verifierDidFromQr(
          '  https://dev-identity-dwallet.l-net.io/wallet/shareverify/$did  ',
        ),
        did,
      );
    });

    test('desescapa un DID percent-encoded en el path', () {
      final encoded = Uri.encodeComponent(did);
      expect(
        verifierDidFromQr('https://host/wallet/shareverify/$encoded'),
        did,
      );
    });

    test('acepta un DID pelado', () {
      expect(verifierDidFromQr(did), did);
    });

    test('rechaza un QR sin DID', () {
      expect(verifierDidFromQr('https://example.com/algo'), isNull);
      expect(verifierDidFromQr('hola mundo'), isNull);
      expect(verifierDidFromQr(''), isNull);
      expect(verifierDidFromQr(null), isNull);
    });
  });

  group('rolesFrom', () {
    test('junta roles de realm_access y de todos los clientes, en minúscula', () {
      final roles = rolesFrom({
        'realm_access': {
          'roles': ['offline_access'],
        },
        'resource_access': {
          'd-wallet-cli': {
            'roles': ['Holder'],
          },
          'account': {
            'roles': ['view-profile'],
          },
        },
      });

      expect(roles, containsAll(['offline_access', 'holder', 'view-profile']));
    });

    test('tolera un payload sin roles', () {
      expect(rolesFrom({}), isEmpty);
    });
  });

  group('Session', () {
    test('el exp del token le gana a expires_in', () {
      // {"exp":2000000000,"preferred_username":"holderuser"}
      const token =
          'eyJhbGciOiJIUzI1NiJ9.'
          'eyJleHAiOjIwMDAwMDAwMDAsInByZWZlcnJlZF91c2VybmFtZSI6ImhvbGRlcnVzZXIifQ.'
          'sig';

      final session = Session.fromTokenResponse({
        'access_token': token,
        'expires_in': 3600,
        'did': 'did:lac:openprotest:0xabc',
      });

      expect(session.username, 'holderuser');
      expect(
        session.expiresAt,
        DateTime.fromMillisecondsSinceEpoch(2000000000 * 1000),
      );
      expect(session.isExpired, isFalse);
    });

    test('did queda en null cuando el login no lo devuelve', () {
      final session = Session.fromTokenResponse({'access_token': 'a.b.c'});
      expect(session.did, isNull);
    });
  });

  group('shortenDid', () {
    test('conserva el prefijo del método y acorta el identificador', () {
      expect(
        shortenDid('did:lac:openprotest:0x31acaef0d9331d5c04c5953ac23feb0e5e7e49fc'),
        'did:lac:openprotest:0x31ac…49fc',
      );
    });

    test('deja intacto un DID corto', () {
      expect(shortenDid('did:lac:test:0xabc'), 'did:lac:test:0xabc');
    });
  });

  group('HolderCredential', () {
    test('separa el tipo camelCase para mostrarlo', () {
      const credential = HolderCredential(
        id: '1',
        type: 'UniversityDegreeCredential',
      );
      expect(credential.displayType, 'University Degree Credential');
    });

    test('usa un texto por defecto cuando no hay tipo', () {
      const credential = HolderCredential(id: '1');
      expect(credential.displayType, 'Credencial verificable');
    });
  });
}
