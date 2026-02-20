<template>
  <div class="exercise-form-container" v-if="showExerciseForm">
    <form @submit.prevent="handleExerciseSubmit" class="exercise-form">
      <div class="form-header">
        <h4>{{ isEditingExercise ? 'Edit Exercise' : 'Add Exercise to Lesson' }}</h4>
        <p>
          {{
            isEditingExercise
              ? 'Update the exercise details below.'
              : 'Create a new exercise for this lesson.'
          }}
        </p>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Exercise Type</label>
          <div class="exercise-type-toggle">
            <button
              type="button"
              @click="exerciseType = 'multiple_choice'"
              :class="{ active: exerciseType === 'multiple_choice' }"
            >
              Multiple Choice
            </button>
            <button
              type="button"
              @click="exerciseType = 'fill_blank'"
              :class="{ active: exerciseType === 'fill_blank' }"
            >
              Fill in the Blank
            </button>
            <button
              type="button"
              @click="exerciseType = 'paragraph'"
              :class="{ active: exerciseType === 'paragraph' }"
            >
              Paragraph
            </button>
          </div>
        </div>
      </div>

      <!-- Multiple Choice Exercise -->
      <div v-if="exerciseType === 'multiple_choice'" class="exercise-section">
        <div class="form-row">
          <div class="form-group">
            <label for="question">Question</label>
            <textarea
              id="question"
              v-model="exerciseForm.multiple_choice.question"
              rows="3"
              required
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Options</label>
            <div
              v-for="(option, index) in exerciseForm.multiple_choice.options"
              :key="index"
              class="option-item"
            >
              <input
                type="radio"
                v-model="exerciseForm.multiple_choice.correct_answer"
                :value="index"
                :id="'option-' + index"
              />
              <input
                type="text"
                v-model="exerciseForm.multiple_choice.options[index]"
                :placeholder="'Option ' + (index + 1)"
                required
              />
              <button
                type="button"
                @click="removeOption(index)"
                class="remove-option"
                v-if="exerciseForm.multiple_choice.options.length > 2"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <button
              type="button"
              @click="addOption"
              class="add-option-btn"
              v-if="exerciseForm.multiple_choice.options.length < 5"
            >
              <i class="fas fa-plus"></i> Add Option
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="explanation">Explanation</label>
            <textarea
              id="explanation"
              v-model="exerciseForm.multiple_choice.explanation"
              rows="2"
              placeholder="Explain why the correct answer is right"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Fill in the Blank Exercise -->
      <div v-if="exerciseType === 'fill_blank'" class="exercise-section">
        <div class="form-row">
          <div class="form-group">
            <label for="fill-text">Text with Blanks</label>
            <textarea
              id="fill-text"
              v-model="exerciseForm.fill_blank.text"
              rows="4"
              required
              placeholder="Enter text with blanks marked as _____"
            ></textarea>
            <small class="hint">Use underscores (_____) to indicate blanks</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Answers</label>
            <div
              v-for="(answer, index) in exerciseForm.fill_blank.answers"
              :key="index"
              class="answer-item"
            >
              <span class="blank-number">Blank {{ index + 1 }}</span>
              <input
                type="text"
                v-model="exerciseForm.fill_blank.answers[index]"
                required
                :placeholder="'Answer for blank ' + (index + 1)"
              />
              <button
                type="button"
                @click="removeBlankAnswer(index)"
                class="remove-answer"
                v-if="exerciseForm.fill_blank.answers.length > 1"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="fill-explanation">Explanation</label>
            <textarea
              id="fill-explanation"
              v-model="exerciseForm.fill_blank.explanation"
              rows="2"
              placeholder="Provide any additional explanation"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Paragraph Exercise -->
      <div v-if="exerciseType === 'paragraph'" class="exercise-section">
        <div class="form-row">
          <div class="form-group">
            <label for="paragraph-prompt">Prompt</label>
            <textarea
              id="paragraph-prompt"
              v-model="exerciseForm.paragraph.prompt"
              rows="4"
              required
              placeholder="Enter the writing prompt for students"
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="paragraph-guidelines">Guidelines</label>
            <textarea
              id="paragraph-guidelines"
              v-model="exerciseForm.paragraph.guidelines"
              rows="3"
              placeholder="Provide writing guidelines (optional)"
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="paragraph-wordcount">Word Count Range</label>
            <div class="word-count-range">
              <input
                type="number"
                v-model.number="exerciseForm.paragraph.word_count.min"
                min="0"
                placeholder="Min"
              />
              <span>to</span>
              <input
                type="number"
                v-model.number="exerciseForm.paragraph.word_count.max"
                min="0"
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      </div>

   <div class="form-actions">
    <button
      type="button"
      @click="handleCancel"
      class="cancel-btn"
      :disabled="formSubmitting"
    >
      Cancel
    </button>
    <button
      type="button"
      @click="confirmDeleteExercise"
      class="delete-btn"
      :disabled="formSubmitting || !isEditingExercise"
    >
      Delete Exercise
    </button>
    <button
      type="submit"
      class="submit-btn"
      :disabled="formSubmitting || !isFormValid"
    >
      {{ isEditingExercise ? 'Update Exercise' : 'Save Exercise' }}
    </button>
  </div>
    </form>
  </div>
</template>

<script setup>
  import { ref, watch, computed, onMounted } from 'vue'
  import axios from 'axios'
  import { useToast } from 'vue-toastification'

  const toast = useToast()

  const props = defineProps({
    lessonId: [Number, String],
    initialExercise: Object,
    showExerciseForm: Boolean
  })

  const emit = defineEmits([
    'update:showExerciseForm',
    'exercise-saved',
    'exercise-updated',
    'exercise-deleted',
    'cancel-exercise'
  ])

  const formSubmitting = ref(false)
  const exerciseType = ref('multiple_choice')

  // CHANGE 1: Initialize form with default values that maintain ALL exercise types
  const exerciseForm = ref({
    paragraph: {
      prompt: '',
      guidelines: '',
      word_count: { min: 100, max: 300 }
    },
    fill_blank: {
      text: '',
      answers: [''],
      explanation: ''
    },
    multiple_choice: {
      question: '',
      options: ['', ''],
      correct_answer: 0,
      explanation: ''
    }
  })

  // CHANGE 2: Store the original exercise data to maintain all types
  const originalExerciseData = ref(null)

  const isEditingExercise = computed(() => {
    return !!props.initialExercise
  })

  // CHANGE 3: Updated watch to preserve ALL exercise data when editing
  watch(() => props.initialExercise, (newExercise) => {
    if (newExercise) {
      // Store original data
      originalExerciseData.value = { ...newExercise }

      // Preserve ALL existing exercise data, don't overwrite with defaults
      exerciseForm.value = {
        paragraph: {
          prompt: newExercise.paragraph?.prompt || '',
          guidelines: newExercise.paragraph?.guidelines || '',
          word_count: newExercise.paragraph?.word_count || { min: 100, max: 300 }
        },
        fill_blank: {
          text: newExercise.fill_blank?.text || '',
          answers: newExercise.fill_blank?.answers || [''],
          explanation: newExercise.fill_blank?.explanation || ''
        },
        multiple_choice: {
          question: newExercise.multiple_choice?.question || '',
          options: newExercise.multiple_choice?.options || ['', ''],
          correct_answer: newExercise.multiple_choice?.correct_answer || 0,
          explanation: newExercise.multiple_choice?.explanation || ''
        }
      }

      // CHANGE 4: Set active tab based on which exercise type has data
      if (newExercise.multiple_choice && newExercise.multiple_choice.question) {
        exerciseType.value = 'multiple_choice'
      } else if (newExercise.fill_blank && newExercise.fill_blank.text) {
        exerciseType.value = 'fill_blank'
      } else if (newExercise.paragraph && newExercise.paragraph.prompt) {
        exerciseType.value = 'paragraph'
      }
    } else {
      resetForm()
    }
  }, { immediate: true, deep: true })

  function resetForm() {
    exerciseForm.value = {
      paragraph: {
        prompt: '',
        guidelines: '',
        word_count: { min: 100, max: 300 }
      },
      fill_blank: {
        text: '',
        answers: [''],
        explanation: ''
      },
      multiple_choice: {
        question: '',
        options: ['', ''],
        correct_answer: 0,
        explanation: ''
      }
    }
    exerciseType.value = 'multiple_choice'
    originalExerciseData.value = null
  }

  function addOption() {
    if (exerciseForm.value.multiple_choice.options.length < 5) {
      exerciseForm.value.multiple_choice.options.push('')
    }
  }

  function removeOption(index) {
    if (exerciseForm.value.multiple_choice.options.length > 2) {
      exerciseForm.value.multiple_choice.options.splice(index, 1)
      // Adjust correct answer if needed
      if (exerciseForm.value.multiple_choice.correct_answer >= index) {
        exerciseForm.value.multiple_choice.correct_answer = Math.max(
          0,
          exerciseForm.value.multiple_choice.correct_answer - 1
        )
      }
    }
  }

  function removeBlankAnswer(index) {
    if (exerciseForm.value.fill_blank.answers.length > 1) {
      exerciseForm.value.fill_blank.answers.splice(index, 1)
    }
  }

  async function handleExerciseSubmit() {
    formSubmitting.value = true

    try {
      // CHANGE 5: Build complete exercise data preserving ALL types
      const exerciseData = {}

      // Always include all exercise types, but only send data for types that have content
      if (hasValidMultipleChoice()) {
        exerciseData.multiple_choice = exerciseForm.value.multiple_choice
      } else if (originalExerciseData.value?.multiple_choice) {
        // If editing and original had multiple choice but current doesn't, preserve it
        exerciseData.multiple_choice = originalExerciseData.value.multiple_choice
      }

      if (hasValidFillBlank()) {
        exerciseData.fill_blank = exerciseForm.value.fill_blank
      } else if (originalExerciseData.value?.fill_blank) {
        // If editing and original had fill blank but current doesn't, preserve it
        exerciseData.fill_blank = originalExerciseData.value.fill_blank
      }

      if (hasValidParagraph()) {
        exerciseData.paragraph = exerciseForm.value.paragraph
      } else if (originalExerciseData.value?.paragraph) {
        // If editing and original had paragraph but current doesn't, preserve it
        exerciseData.paragraph = originalExerciseData.value.paragraph
      }

      const url = `/api/admin/lessons/${props.lessonId}/exercise/`
      const method = isEditingExercise.value ? 'PUT' : 'POST'

      const response = await axios({
        method,
        url,
        data: exerciseData
      })

      if (isEditingExercise.value) {
        emit('exercise-updated', response.data.exercise)
        toast.success('Exercise updated successfully')
      } else {
        emit('exercise-saved', response.data.exercise)
        toast.success('Exercise created successfully')
      }

      emit('update:showExerciseForm', false)
    } catch (error) {
      console.error('Error saving exercise:', error)
      toast.error(error.response?.data?.error || 'Failed to save exercise')
    } finally {
      formSubmitting.value = false
    }
  }

  // CHANGE 6: Helper functions to check if exercise types have valid data
  function hasValidMultipleChoice() {
    const mc = exerciseForm.value.multiple_choice
    return mc.question && mc.options.every(opt => opt.trim()) && mc.options.length >= 2
  }

  function hasValidFillBlank() {
    const fb = exerciseForm.value.fill_blank
    return fb.text && fb.answers.every(ans => ans.trim()) && fb.answers.length >= 1
  }

  function hasValidParagraph() {
    const p = exerciseForm.value.paragraph
    return p.prompt.trim()
  }

  function handleCancel() {
    resetForm()
    emit('cancel-exercise')
  }

  async function confirmDeleteExercise() {
    if (confirm('Are you sure you want to delete this exercise? This cannot be undone.')) {
      formSubmitting.value = true
      try {
        await axios.delete(`/api/admin/lessons/${props.lessonId}/exercise/`)
        emit('exercise-deleted')
        toast.success('Exercise deleted successfully')
        emit('update:showExerciseForm', false)
      } catch (error) {
        console.error('Error deleting exercise:', error)
        toast.error(error.response?.data?.error || 'Failed to delete exercise')
      } finally {
        formSubmitting.value = false
      }
    }
  }

  // CHANGE 7: Updated getCurrentExerciseData to return ALL exercise data
  defineExpose({
    getCurrentExerciseData: () => {
      const exerciseData = {}

      if (hasValidMultipleChoice()) {
        exerciseData.multiple_choice = exerciseForm.value.multiple_choice
      }

      if (hasValidFillBlank()) {
        exerciseData.fill_blank = exerciseForm.value.fill_blank
      }

      if (hasValidParagraph()) {
        exerciseData.paragraph = exerciseForm.value.paragraph
      }

      return exerciseData
    }
  })

  // CHANGE 8: Updated form validation to check current active tab
  const isFormValid = computed(() => {
    if (exerciseType.value === 'multiple_choice') {
      return hasValidMultipleChoice()
    } else if (exerciseType.value === 'fill_blank') {
      return hasValidFillBlank()
    } else if (exerciseType.value === 'paragraph') {
      return hasValidParagraph()
    }
    return false
  })
</script>


<style scoped>
.exercise-form-container {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  /* box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); */
}

.exercise-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
}

.form-header p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.exercise-type-toggle {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.exercise-type-toggle button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.exercise-type-toggle button.active {
  background-color: #087990;
  color: white;
  border-color: #087990;
}

.exercise-section {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.option-item,
.answer-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.option-item input[type='radio'] {
  margin-right: 0.5rem;
}

.option-item input[type='text'],
.answer-item input[type='text'] {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.remove-option,
.remove-answer {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 4px;
}

.remove-option:hover,
.remove-answer:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.add-option-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px dashed #dee2e6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  color: #087990;
  margin-top: 0.5rem;
  transition: all 0.2s;
}

.add-option-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  border-style: solid;
}

.blank-number {
  min-width: 70px;
  font-size: 0.85rem;
  color: #6c757d;
}

.word-count-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.word-count-range input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.word-count-range span {
  color: #6c757d;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #dee2e6;
}

.cancel-btn {
  background-color: #fff;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #f8f9fa;
}

.delete-btn {
  background-color: #fff;
  border: 1px solid #f8d7da;
  color: #dc3545;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: auto;
}

.delete-btn:hover {
  background-color: #f8d7da;
}

.submit-btn {
  background-color: #087990;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover {
  background-color: #065e6f;
}

.submit-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
}

textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #087990;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.25);
}

.hint {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

/* ==================== Mobile Responsive Styles ==================== */
@media (max-width: 767.98px) {
  .cancel-btn{
    display: none !important;
  }
}
</style>