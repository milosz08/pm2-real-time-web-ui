'use strict';

function JsonEditor(editor, rawContainer, csrf) {
  this.editor = editor;
  this.rawContainer = rawContainer;
  this.csrf = csrf;
}

JsonEditor.prototype.configureEditor = function() {
  this.editor.session.setMode("ace/mode/json");
  this.editor.setTheme("ace/theme/tomorrow_night");
  this.editor.setOptions({
    wrap: true,
    fontSize: "16px",
  });
}

JsonEditor.prototype.onSave = function(e) {
  if (e.ctrlKey && e.key === 's' && this.editor.isFocused()) {
    e.preventDefault();
    const content = this.editor.getValue();
    try {
      const dataObject = JSON.parse(content);
      const minifiedContent = JSON.stringify(dataObject);
      fetch('/api/ecosystem-file', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          _csrf: this.csrf.value,
          content: minifiedContent
        }),
      })
        .then(res => res.json())
        .then(data => {
          const { csrf: csrfRes, ...rest } = data;
          this.csrf.value = csrfRes;
          if (data.status === 'success') {
            this.updateContent(JSON.stringify(dataObject, null, 2));
          }
          window.toast.show({ ...rest });
        })
        .catch(() =>  window.toast.show({
          message: 'Unexpected error',
          status: 'error',
        }));
    } catch (e) {
      window.toast.error('Incorrect ecosystem file structure.');
    }
  }
}

JsonEditor.prototype.updateContent = function(value) {
  const cursorPosition = this.editor.getCursorPosition();
  this.editor.setValue(value);
  this.editor.selection.clearSelection();
  this.editor.moveCursorTo(cursorPosition.row, cursorPosition.column);
}

function onContentLoad() {
  const rawContainer = document.getElementById('rawContent');
  const csrfToken = document.getElementById('csrf');
  const aceEditor = ace.edit("editor");

  const jsonEditor = new JsonEditor(aceEditor, rawContainer, csrfToken);

  jsonEditor.configureEditor();
  jsonEditor.updateContent(jsonEditor.rawContainer.value);

  document.addEventListener('keydown', function (e) {
    jsonEditor.onSave(e);
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);