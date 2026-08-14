import type { CredentialTypeOption } from '../types';

const RAW_BASE = 'https://raw.githubusercontent.com/LNetNetworks/vc-repository/main/schemas';

// Bundled as a local fallback: as of this writing only test_reference.json
// actually exists in the vc-repository repo (the rest 404). The canonical
// raw.githubusercontent.com URL is still what gets sent as `context` on
// issuance per spec — these local copies only drive the Step 2 form so the
// wizard keeps working while the repo catches up.
export const CREDENTIAL_TYPES: CredentialTypeOption[] = [
  {
    type: 'Education',
    label: 'Education',
    schemaUrl: `${RAW_BASE}/education_schema.json`,
    localSchema: {
      title: 'Education Credential',
      type: 'object',
      required: ['credentialSubject'],
      properties: {
        credentialSubject: {
          type: 'object',
          required: ['id', 'firstName', 'lastName', 'institution', 'degree', 'fieldOfStudy', 'graduationDate', 'country'],
          properties: {
            id: { type: 'string', minLength: 1 },
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 },
            institution: { type: 'string', minLength: 1 },
            degree: { type: 'string', minLength: 1 },
            fieldOfStudy: { type: 'string', minLength: 1 },
            graduationDate: { type: 'string', format: 'date' },
            country: { type: 'string', minLength: 1 },
          },
        },
      },
    },
  },
  {
    type: 'Skills',
    label: 'Skills',
    schemaUrl: `${RAW_BASE}/skills_schema.json`,
    localSchema: {
      title: 'Skills Credential',
      type: 'object',
      required: ['credentialSubject'],
      properties: {
        credentialSubject: {
          type: 'object',
          required: ['id', 'firstName', 'lastName', 'skill', 'level', 'yearsOfExperience'],
          properties: {
            id: { type: 'string', minLength: 1 },
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 },
            skill: { type: 'string', minLength: 1 },
            level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
            yearsOfExperience: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  },
  {
    type: 'Health',
    label: 'Health',
    schemaUrl: `${RAW_BASE}/health_schema.json`,
    localSchema: {
      title: 'Health Credential',
      type: 'object',
      required: ['credentialSubject'],
      properties: {
        credentialSubject: {
          type: 'object',
          required: ['id', 'firstName', 'lastName', 'recordType', 'description', 'issuedDate', 'issuedBy'],
          properties: {
            id: { type: 'string', minLength: 1 },
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 },
            recordType: { type: 'string', minLength: 1 },
            description: { type: 'string', minLength: 1 },
            issuedDate: { type: 'string', format: 'date' },
            issuedBy: { type: 'string', minLength: 1 },
          },
        },
      },
    },
  },
  {
    type: 'Default',
    label: 'Default',
    schemaUrl: `${RAW_BASE}/default_schema.json`,
    localSchema: {
      title: 'Default Credential',
      type: 'object',
      required: ['credentialSubject'],
      properties: {
        credentialSubject: {
          type: 'object',
          required: ['id', 'name', 'description'],
          properties: {
            id: { type: 'string', minLength: 1 },
            name: { type: 'string', minLength: 1 },
            description: { type: 'string', minLength: 1 },
          },
        },
      },
    },
  },
];

export async function fetchSchema(option: CredentialTypeOption) {
  try {
    const res = await fetch(option.schemaUrl);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return option.localSchema;
  }
}
