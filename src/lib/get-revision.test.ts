import cp from 'node:child_process'
import { getRevision } from './get-revision'

describe('getRelease', () => {
  let providedRelease: string | undefined
  const subject = () => getRevision({ revision: providedRelease })

  describe('when git returns valid output', () => {
    beforeEach(() => {
      jest.spyOn(cp, 'exec').mockImplementation((command, callback) => {
        ;(callback as any)(null, 'asdi76klj')
        return null as any
      })
    })

    describe('when release is not provided', () => {
      beforeEach(() => {
        providedRelease = undefined
      })

      it('returns the release from git', async () => {
        expect(await subject()).toBe('asdi76klj')
      })
    })

    describe('when release is provided', () => {
      describe('when provided release has whitespace', () => {
        beforeEach(() => {
          providedRelease = '     my release       '
        })

        it('returns the provided release and trims it', async () => {
          expect(await subject()).toBe('my release')
        })
      })

      describe('when provided release has no whitespace', () => {
        beforeEach(() => {
          providedRelease = 'my release'
        })

        it('returns the provided release', async () => {
          expect(await subject()).toBe('my release')
        })
      })
    })
  })

  describe('when git returns invalid output', () => {
    beforeEach(() => {
      jest.spyOn(cp, 'exec').mockImplementation((command, callback) => {
        ;(callback as any)(new Error('error'))
        return null as any
      })
    })

    describe('when release is not provided', () => {
      beforeEach(() => {
        providedRelease = undefined
      })

      it('returns undefined', async () => {
        expect(await subject()).toBeUndefined()
      })
    })

    describe('when release is provided', () => {
      beforeEach(() => {
        providedRelease = 'my release'
      })

      it('returns the provided release', async () => {
        expect(await subject()).toBe('my release')
      })
    })
  })
})
