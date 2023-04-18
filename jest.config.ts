import type { Config } from 'jest'

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  transform: {
    '^.+\\.ts': 'ts-jest',
  },
  clearMocks: true,
  extensionsToTreatAsEsm: ['.ts'],
} satisfies Config
