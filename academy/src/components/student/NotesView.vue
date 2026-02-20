<template>
  <div class="notes-view">
    <h3 class="section-title">Saved Notes</h3>
    <p>Access and manage your saved notes.</p>

    <div class="notes-container">
      <div class="notes-sidebar">
        <div class="notes-search">
          <input type="text" placeholder="Search notes..." v-model="notesSearchQuery">
          <i class="fas fa-search"></i>
        </div>

        <div class="notes-folders">
          <div class="folder" v-for="folder in noteFolders" :key="folder.id"
               :class="{ 'active': activeFolder === folder.id }"
               @click="activeFolder = folder.id">
            <i :class="folder.icon"></i>
            <span>{{ folder.name }}</span>
            <span class="note-count">{{ folder.count }}</span>
          </div>
        </div>
      </div>

      <div class="notes-content">
        <div class="notes-toolbar">
          <button class="btn-new-note">
            <i class="fas fa-plus"></i> New Note
          </button>
          <div class="notes-filter">
            <span>Sort by:</span>
            <select v-model="notesSortBy">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        <div class="notes-list">
          <div class="note-card" v-for="note in filteredNotes" :key="note.id">
            <div class="note-header">
              <h5>{{ note.title }}</h5>
              <span class="note-date">{{ note.date }}</span>
            </div>
            <div class="note-preview">
              {{ note.preview }}
            </div>
            <div class="note-footer">
              <span class="note-course">{{ note.course }}</span>
              <div class="note-actions">
                <button class="btn-edit"><i class="fas fa-edit"></i></button>
                <button class="btn-delete"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Notes data
const noteFolders = ref([
  { id: 1, name: 'All Notes', icon: 'fas fa-sticky-note', count: 24 },
  { id: 2, name: 'Web Development', icon: 'fas fa-code', count: 12 },
  { id: 3, name: 'Algorithms', icon: 'fas fa-laptop-code', count: 6 },
  { id: 4, name: 'Database', icon: 'fas fa-database', count: 4 },
  { id: 5, name: 'Favorites', icon: 'fas fa-star', count: 8 }
]);

const notes = ref([
  { id: 1, title: 'CSS Grid Layout Notes', preview: 'Key concepts for working with CSS Grid...', course: 'Web Development', date: 'Today', folder: 2 },
  { id: 2, title: 'Binary Search Trees', preview: 'Implementation details and time complexity...', course: 'Algorithms', date: 'Yesterday', folder: 3 },
  { id: 3, title: 'SQL Joins Cheat Sheet', preview: 'Different types of joins and their syntax...', course: 'Database', date: '3 days ago', folder: 4 },
  { id: 4, title: 'JavaScript Promises', preview: 'How to work with async code using promises...', course: 'Web Development', date: '1 week ago', folder: 2 }
]);

const activeFolder = ref(1);
const notesSearchQuery = ref('');
const notesSortBy = ref('recent');

const filteredNotes = computed(() => {
  let result = [...notes.value];

  if (activeFolder.value !== 1) {
    result = result.filter(note => note.folder === activeFolder.value);
  }

  if (notesSearchQuery.value) {
    const query = notesSearchQuery.value.toLowerCase();
    result = result.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.preview.toLowerCase().includes(query) ||
      note.course.toLowerCase().includes(query)
    );
  }

  if (notesSortBy.value === 'recent') {
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (notesSortBy.value === 'oldest') {
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (notesSortBy.value === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
});
</script>

<style scoped>
.section-title {
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    color: var(--text-color);
    margin: 0 0 14.4px 0;
    font-weight: 600;
    position: relative;
    padding-bottom: 9px;
    text-align:start;
}

.section-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 45px;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: 3px;
}

.notes-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
}

.notes-sidebar {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.notes-search {
  position: relative;
  margin-bottom: 15px;
}

.notes-search input {
  width: 100%;
  padding: 8px 30px 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
}

.notes-search i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-color);
}

.notes-folders {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.folder {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.folder:hover {
  background-color: rgba(8, 121, 144, 0.05);
}

.folder.active {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.folder i {
  margin-right: 8px;
  font-size: 0.9rem;
}

.note-count {
  margin-left: auto;
  font-size: 0.8rem;
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 10px;
}

.notes-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.notes-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.btn-new-note {
  padding: 6px 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.notes-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.notes-filter select {
  padding: 5px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
}

.notes-list {
  display: grid;
  gap: 15px;
}

.note-card {
  padding: 12px;
  border-radius: 6px;
  background-color: rgba(8, 121, 144, 0.03);
  border: 1px solid var(--border-color);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.note-header h5 {
  margin: 0;
  font-size: 0.9rem;
}

.note-date {
  font-size: 0.8rem;
  color: var(--secondary-color);
}

.note-preview {
  font-size: 0.9rem;
  color: var(--secondary-color);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-course {
  font-size: 0.8rem;
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 10px;
}

.note-actions {
  display: flex;
  gap: 5px;
}

.btn-edit, .btn-delete {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.btn-edit {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.btn-delete {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

/* Responsive styles */
@media (max-width: 768px) {
  .notes-container {
    grid-template-columns: 1fr;
  }

  .notes-sidebar {
    display: none;
  }
}
@media (max-width: 992px) {
.btn-new-note {
  padding: 6px 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}
}
</style>