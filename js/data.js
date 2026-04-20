function taskFilesHtml(taskId){
  const task = (db.tasks || []).find(t => String(t.id) === String(taskId));

  const files = (db.taskFiles || []).filter(f => {
    return String(f.taskId) === String(taskId) ||
      (task?.fromNoteId && String(f.noteId) === String(task.fromNoteId));
  });

  if(!files.length){
    return '<div class="muted" style="font-size:12px">Failų nėra</div>';
  }

  return files.map(f => `
    <div class="muted" style="font-size:12px;margin-top:4px">
      📎 <a href="#" data-open-file="${f.id}">${escapeHtml(f.fileName)}</a>
      ${f.uploadedByName ? `• įkėlė ${escapeHtml(f.uploadedByName)}` : ''}
    </div>
  `).join('');
}

function completedFilesHtml(taskId){
  if(!taskId){
    return '<div class="muted" style="font-size:12px">Failų nėra</div>';
  }

  const task = (db.tasks || []).find(t => String(t.id) === String(taskId));

  const files = (db.taskFiles || []).filter(f => {
    return String(f.taskId) === String(taskId) ||
      (task?.fromNoteId && String(f.noteId) === String(task.fromNoteId));
  });

  if(!files.length){
    return '<div class="muted" style="font-size:12px">Failų nėra</div>';
  }

  return files.map(f => `
    <div class="muted" style="font-size:12px;margin-top:4px">
      📎 <a href="#" data-open-file="${f.id}">${escapeHtml(f.fileName)}</a>
      ${f.uploadedByName ? `• įkėlė ${escapeHtml(f.uploadedByName)}` : ''}
    </div>
  `).join('');
}

function noteFilesHtml(noteId){
  const files = (db.taskFiles || []).filter(f => String(f.noteId) === String(noteId));

  if(!files.length){
    return '<div class="muted" style="font-size:12px">Failų nėra</div>';
  }

  return files.map(f => `
    <div class="muted" style="font-size:12px;margin-top:4px">
      📎 <a href="#" data-open-file="${f.id}">${escapeHtml(f.fileName)}</a>
      ${f.uploadedByName ? `• įkėlė ${escapeHtml(f.uploadedByName)}` : ''}
    </div>
  `).join('');
}

function bindTaskFileUploads(user){
  document.querySelectorAll('[data-upload-task-file]').forEach(btn => {
    btn.onclick = async () => {
      const taskId = btn.getAttribute('data-upload-task-file');
      const input = document.querySelector(`input[data-task-file="${taskId}"]`);
      const file = input?.files?.[0];

      if(!file){
        alert('Pasirink failą.');
        return;
      }

      const saved = await uploadTaskFileToSupabase(file, { taskId }, user);
      if(!saved){
        alert('Nepavyko įkelti failo.');
        return;
      }

      if(!db.taskFiles) db.taskFiles = [];
      db.taskFiles.unshift(saved);

      alert('Failas įkeltas.');
      render();
    };
  });

  document.querySelectorAll('[data-open-file]').forEach(link => {
    link.onclick = async (e) => {
      e.preventDefault();

      const id = link.getAttribute('data-open-file');
      const file = (db.taskFiles || []).find(f => String(f.id) === String(id));
      if(!file) return;

      const newTab = window.open('', '_blank');

      if(newTab){
        newTab.document.write('<p style="font-family:sans-serif;padding:20px;">Kraunama...</p>');
      }

      const url = await getTaskFileUrl(file.filePath);
      if(!url){
        if(newTab) newTab.close();
        alert('Nepavyko atidaryti failo.');
        return;
      }

      if(newTab){
        newTab.location.href = url;
      } else {
        window.location.assign(url);
      }
    };
  });
}