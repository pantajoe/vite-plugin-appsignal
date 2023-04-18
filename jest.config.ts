import type { Config } from 'jest'

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts': 'ts-jest',
  },
  clearMocks: true,
  extensionsToTreatAsEsm: ['.ts'],
} satisfies Config
