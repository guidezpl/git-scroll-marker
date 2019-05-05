'use babel';

import GitScrollMarkerBinding from '../lib/git-scroll-marker-binding';
import path from 'path'
import fs from 'fs-plus'
import temp from 'temp'

const addClass = '.git-marker-layer-add'
const editClass = '.git-marker-layer-edit'
const removeClass = '.git-marker-layer-remove'
const removeClass2 = '.git-marker-layer-remove' // prev line

//TODO: update tests
describe('git-scroll-marker package', () => {
  let editor, editorElement, projectPath

  beforeEach(() => {
    spyOn(window, 'setImmediate').andCallFake(fn => fn())

    projectPath = temp.mkdirSync('git-scroll-marker-spec-')
    const otherPath = temp.mkdirSync('some-other-path-')

    fs.copySync(path.join(__dirname, 'fixtures', 'working-dir'), projectPath)
    fs.moveSync(
      path.join(projectPath, 'git.git'),
      path.join(projectPath, '.git')
    )
    atom.project.setPaths([otherPath, projectPath])

    jasmine.attachToDOM(atom.workspace.getElement())

    waitsForPromise(() =>
    atom.workspace.open(path.join(projectPath, 'sample.js')))

    runs(() => {
      editor = atom.workspace.getActiveTextEditor()
      editorElement = editor.getElement()
    })

    waitsForPromise(() => atom.packages.activatePackage('git-scroll-marker'))
  })

  describe('when the editor has modified lines', () => {
    it('highlights the modified lines', () => {
      expect(editorElement.querySelectorAll(editClass).length).toBe(
        0
      )
      editor.insertText('a')
      advanceClock(editor.getBuffer().stoppedChangingDelay)
      expect(editorElement.querySelectorAll(editClass).length).toBe(
        1
      )
      expect(editorElement.querySelector(editClass)).toHaveData(
        'buffer-row',
        0
      )
    })
  })

  describe('when the editor has added lines', () => {
    it('highlights the added lines', () => {
      expect(editorElement.querySelectorAll(addClass).length).toBe(0)
      editor.moveToEndOfLine()
      editor.insertNewline()
      editor.insertText('a')
      advanceClock(editor.getBuffer().stoppedChangingDelay)
      expect(editorElement.querySelectorAll(addClass).length).toBe(1)
      expect(editorElement.querySelector(addClass)).toHaveData(
        'buffer-row',
        1
      )
    })
  })

  describe('when the editor has removed lines', () => {
    it('highlights the line preceeding the deleted lines', () => {
      expect(editorElement.querySelectorAll(addClass).length).toBe(0)
      editor.setCursorBufferPosition([5])
      editor.deleteLine()
      advanceClock(editor.getBuffer().stoppedChangingDelay)
      expect(editorElement.querySelectorAll(removeClass).length).toBe(1)
      expect(editorElement.querySelector(removeClass)).toHaveData(
        'buffer-row',
        4
      )
    })
  })

  describe('when the editor has removed the first line', () => {
    it('highlights the line preceeding the deleted lines', () => {
      expect(editorElement.querySelectorAll(addClass).length).toBe(0)
      editor.setCursorBufferPosition([0, 0])
      editor.deleteLine()
      advanceClock(editor.getBuffer().stoppedChangingDelay)
      expect(
        editorElement.querySelectorAll(removeClass2).length
      ).toBe(1)
      expect(
        editorElement.querySelector(removeClass2)
      ).toHaveData('buffer-row', 0)
    })
  })

  describe('when a modified line is restored to the HEAD version contents', () => {
    it('removes the diff highlight', () => {
      expect(editorElement.querySelectorAll(editClass).length).toBe(
        0
      )
      editor.insertText('a')
      advanceClock(editor.getBuffer().stoppedChangingDelay)
      expect(editorElement.querySelectorAll(editClass).length).toBe(
        1
      )
      editor.backspace()
      advanceClock(editor.getBuffer().stoppedChangingDelay)
      expect(editorElement.querySelectorAll(editClass).length).toBe(
        0
      )
    })
  })

  describe('when a modified file is opened', () => {
    it('highlights the changed lines', () => {
      fs.writeFileSync(
        path.join(projectPath, 'sample.txt'),
        'Some different text.'
      )
      let nextTick = false

      waitsForPromise(() =>
      atom.workspace.open(path.join(projectPath, 'sample.txt'))
    )

    runs(() => {
      editorElement = atom.workspace.getActiveTextEditor().getElement()
    })

    setImmediate(() => {
      nextTick = true
    })

    waitsFor(() => nextTick)

    runs(() => {
      expect(
        editorElement.querySelectorAll(editClass).length
      ).toBe(1)
      expect(editorElement.querySelector(editClass)).toHaveData(
        'buffer-row',
        0)
      })
    })
  })

  describe('when the project paths change', () => {
    it("doesn't try to use the destroyed git repository", () => {
      editor.deleteLine()
      atom.project.setPaths([temp.mkdirSync('no-repository')])
      advanceClock(editor.getBuffer().stoppedChangingDelay)
    })
  })
})
