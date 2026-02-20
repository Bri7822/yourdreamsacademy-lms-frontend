<template>
  <div class="exercises-section">
    <div class="section-header">
      <i class="fas fa-dumbbell"></i>
      <h3>Practice Exercises</h3>
    </div>

    <div 
      v-for="(exercise, index) in exercises" 
      :key="exercise.id"
      class="exercise-card"
    >
      <div class="exercise-header">
        <h4>Exercise {{ index + 1 }}: {{ getExerciseTypeName(exercise.type) }}</h4>
        <div v-if="exerciseResults[exercise.id]" class="exercise-status">
          <i :class="exerciseResults[exercise.id].is_correct ? 'fas fa-check-circle correct' : 'fas fa-times-circle incorrect'"></i>
          <span>{{ exerciseResults[exercise.id].is_correct ? 'Correct' : 'Incorrect' }}</span>
        </div>
      </div>
      
      <div class="exercise-content">
        <p class="exercise-question">{{ exercise.question }}</p>

        <!-- Multiple Choice -->
        <div v-if="exercise.type === 'multiple-choice'" class="multiple-choice">
          <div 
            v-for="(option, optionIndex) in exercise.options"
            :key="optionIndex"
            :class="['option', { 
              'selected': exerciseAnswers[exercise.id] === optionIndex,
              'correct': showResults[exercise.id] && optionIndex === exercise.correct,
              'incorrect': showResults[exercise.id] && exerciseAnswers[exercise.id] === optionIndex && optionIndex !== exercise.correct,
              'disabled': showResults[exercise.id] && exerciseResults[exercise.id]?.is_correct
            }]"
            @click="!showResults[exercise.id] || !exerciseResults[exercise.id]?.is_correct ? selectOption(exercise.id, optionIndex) : null"
          >
            <div class="option-indicator">
              <i :class="exerciseAnswers[exercise.id] === optionIndex ? 'fas fa-dot-circle' : 'far fa-circle'"></i>
            </div>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>

        <!-- Fill in the Blank -->
        <div v-else-if="exercise.type === 'fill-blank'" class="fill-blank">
          <input 
            v-model="exerciseAnswers[exercise.id]"
            type="text"
            placeholder="Type your answer here..."
            class="blank-input"
            :class="{ 
              'correct': showResults[exercise.id] && exerciseResults[exercise.id]?.is_correct,
              'incorrect': showResults[exercise.id] && !exerciseResults[exercise.id]?.is_correct
            }"
            :disabled="showResults[exercise.id] && exerciseResults[exercise.id]?.is_correct"
            @keyup.enter="submitAnswer(exercise)"
          />
        </div>

        <!-- True/False -->
        <div v-else-if="exercise.type === 'true-false'" class="true-false">
          <div class="tf-options">
            <label 
              :class="['tf-option', { 
                'selected': exerciseAnswers[exercise.id] === 'true',
                'correct': showResults[exercise.id] && exercise.correct === 'true',
                'incorrect': showResults[exercise.id] && exerciseAnswers[exercise.id] === 'true' && exercise.correct !== 'true'
              }]"
            >
              <input 
                v-model="exerciseAnswers[exercise.id]"
                type="radio"
                :value="'true'"
                :name="`exercise-${exercise.id}`"
                :disabled="showResults[exercise.id] && exerciseResults[exercise.id]?.is_correct"
              />
              <span class="tf-text">True</span>
            </label>
            <label 
              :class="['tf-option', { 
                'selected': exerciseAnswers[exercise.id] === 'false',
                'correct': showResults[exercise.id] && exercise.correct === 'false',
                'incorrect': showResults[exercise.id] && exerciseAnswers[exercise.id] === 'false' && exercise.correct !== 'false'
              }]"
            >
              <input 
                v-model="exerciseAnswers[exercise.id]"
                type="radio"
                :value="'false'"
                :name="`exercise-${exercise.id}`"
                :disabled="showResults[exercise.id] && exerciseResults[exercise.id]?.is_correct"
              />
              <span class="tf-text">False</span>
            </label>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="exercise-actions">
          <button 
            @click="submitAnswer(exercise)"
            :disabled="!hasAnswer(exercise.id) || submittingAnswer === exercise.id || (exerciseResults[exercise.id]?.is_correct && showResults[exercise.id])"
            class="check-btn"
            :class="{ 'submitted': exerciseResults[exercise.id]?.is_correct && showResults[exercise.id] }"
          >
            <i v-if="submittingAnswer === exercise.id" class="fas fa-spinner fa-spin"></i>
            <i v-else-if="exerciseResults[exercise.id]?.is_correct && showResults[exercise.id]" class="fas fa-check"></i>
            {{ getSubmitButtonText(exercise.id) }}
          </button>
          
          <!-- Try Again Button -->
          <button 
            v-if="showResults[exercise.id] && !exerciseResults[exercise.id]?.is_correct"
            @click="resetExercise(exercise.id)"
            class="try-again-btn"
          >
            <i class="fas fa-redo"></i>
            Try Again
          </button>
        </div>

        <!-- Results -->
        <div 
          v-if="showResults[exercise.id] && exerciseResults[exercise.id]" 
          :class="['exercise-result', { 
            'correct': exerciseResults[exercise.id].is_correct,
            'incorrect': !exerciseResults[exercise.id].is_correct
          }]"
        >
          <div class="result-header">
            <i :class="exerciseResults[exercise.id].is_correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
            <span>{{ exerciseResults[exercise.id].is_correct ? 'Correct!' : 'Incorrect' }}</span>
          </div>
          <p class="explanation">{{ exercise.explanation }}</p>
          
          <!-- Show correct answer for incorrect responses -->
          <div v-if="!exerciseResults[exercise.id].is_correct" class="correct-answer-hint">
            <small>
              Correct answer: 
              <strong>
                {{ getCorrectAnswerText(exercise) }}
              </strong>
            </small>
          </div>
        </div>

        <!-- Follow-up Exercise (only after correct multiple choice) -->
        <div 
          v-if="exercise.type === 'multiple-choice' && showResults[exercise.id] && exerciseResults[exercise.id]?.is_correct && exercise.follow_up" 
          class="followup-exercise"
        >
          <div class="followup-header">
            <h5>Follow-up Question:</h5>
          </div>
          <div class="exercise-content">
            <p class="exercise-question">{{ getFollowUpQuestion(exercise) }}</p>
            
            <div class="fill-blank">
              <input 
                v-model="followUpAnswers[exercise.id]"
                type="text"
                placeholder="Fill in the missing word..."
                class="blank-input"
                :class="{ 
                  'correct': showFollowUpResults[exercise.id] && followUpResults[exercise.id]?.is_correct,
                  'incorrect': showFollowUpResults[exercise.id] && !followUpResults[exercise.id]?.is_correct
                }"
                :disabled="showFollowUpResults[exercise.id] && followUpResults[exercise.id]?.is_correct"
                @keyup.enter="submitFollowUpAnswer(exercise)"
              />
            </div>

            <div class="exercise-actions">
              <button 
                @click="submitFollowUpAnswer(exercise)"
                :disabled="!followUpAnswers[exercise.id] || submittingFollowUp === exercise.id || (followUpResults[exercise.id]?.is_correct && showFollowUpResults[exercise.id])"
                class="check-btn followup-btn"
                :class="{ 'submitted': followUpResults[exercise.id]?.is_correct && showFollowUpResults[exercise.id] }"
              >
                <i v-if="submittingFollowUp === exercise.id" class="fas fa-spinner fa-spin"></i>
                <i v-else-if="followUpResults[exercise.id]?.is_correct && showFollowUpResults[exercise.id]" class="fas fa-check"></i>
                {{ getFollowUpSubmitButtonText(exercise.id) }}
              </button>
              
              <button 
                v-if="showFollowUpResults[exercise.id] && !followUpResults[exercise.id]?.is_correct"
                @click="resetFollowUpExercise(exercise.id)"
                class="try-again-btn"
              >
                <i class="fas fa-redo"></i>
                Try Again
              </button>
            </div>

            <!-- Follow-up Results -->
            <div 
              v-if="showFollowUpResults[exercise.id] && followUpResults[exercise.id]" 
              :class="['exercise-result', { 
                'correct': followUpResults[exercise.id].is_correct,
                'incorrect': !followUpResults[exercise.id].is_correct
              }]"
            >
              <div class="result-header">
                <i :class="followUpResults[exercise.id].is_correct ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                <span>{{ followUpResults[exercise.id].is_correct ? 'Excellent!' : 'Try again!' }}</span>
              </div>
              <p class="explanation">{{ getFollowUpExplanation(exercise) }}</p>
              
              <!-- Show correct answer if incorrect -->
              <div v-if="!followUpResults[exercise.id].is_correct" class="correct-answer-hint">
                <small>Correct answer: <strong>{{ getFollowUpCorrectAnswer(exercise) }}</strong></small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import axios from 'axios'

// Props
const props = defineProps({
  exercises: {
    type: Array,
    required: true
  },
  lessonId: {
    type: [String, Number],
    required: true
  }
})

// Emits
const emit = defineEmits(['exercise-completed'])

// Reactive state
const exerciseAnswers = ref({})
const showResults = ref({})
const exerciseResults = ref({})
const submittingAnswer = ref(null)

// Follow-up exercise state
const followUpAnswers = ref({})
const showFollowUpResults = ref({})
const followUpResults = ref({})
const submittingFollowUp = ref(null)

// API Base URL
const API_BASE = 'http://localhost:8000/api'

// Toast notification helper
const showToast = (message, type = 'info') => {
  // You can integrate your preferred toast library here
  console.log(`${type}: ${message}`)
}

// Methods
const selectOption = (exerciseId, optionIndex) => {
  exerciseAnswers.value[exerciseId] = optionIndex
}

const hasAnswer = (exerciseId) => {
  const answer = exerciseAnswers.value[exerciseId]
  return answer !== undefined && answer !== null && answer !== ''
}

const submitAnswer = async (exercise) => {
  if (!hasAnswer(exercise.id)) return
  
  submittingAnswer.value = exercise.id
  
  try {
    const response = await axios.post(
      `${API_BASE}/student/lessons/${props.lessonId}/exercises/${exercise.id}/submit/`,
      {
        answer: exerciseAnswers.value[exercise.id]
      }
    )
    
    exerciseResults.value[exercise.id] = response.data
    showResults.value[exercise.id] = true
    
    if (response.data.is_correct) {
      showToast('Correct answer! Well done!', 'success')
      emit('exercise-completed', {
        exerciseId: exercise.id,
        correct: true,
        score: response.data.score
      })
    } else {
      showToast('Incorrect answer. Review the explanation and try again!', 'error')
    }
    
  } catch (err) {
    showToast('Failed to submit answer. Please try again.', 'error')
    console.error('Answer submission error:', err)
  } finally {
    submittingAnswer.value = null
  }
}

const resetExercise = (exerciseId) => {
  exerciseAnswers.value[exerciseId] = exercise.type === 'multiple-choice' ? null : ''
  showResults.value[exerciseId] = false
  exerciseResults.value[exerciseId] = null
}

const submitFollowUpAnswer = async (exercise) => {
  if (!followUpAnswers.value[exercise.id]) return
  
  submittingFollowUp.value = exercise.id
  
  try {
    const response = await axios.post(
      `${API_BASE}/student/lessons/${props.lessonId}/exercises/${exercise.id}/followup/`,
      {
        answer: followUpAnswers.value[exercise.id]
      }
    )
    
    followUpResults.value[exercise.id] = response.data
    showFollowUpResults.value[exercise.id] = true
    
    if (response.data.is_correct) {
      showToast('Excellent! You mastered this concept!', 'success')
      emit('exercise-completed', {
        exerciseId: exercise.id,
        type: 'followup',
        correct: true,
        score: response.data.score
      })
    } else {
      showToast('Not quite right. Try again!', 'error')
    }
    
  } catch (err) {
    // Fallback to local checking if API doesn't support follow-up
    const isCorrect = isFollowUpAnswerCorrect(exercise)
    
    followUpResults.value[exercise.id] = {
      is_correct: isCorrect,
      explanation: getFollowUpExplanation(exercise)
    }
    showFollowUpResults.value[exercise.id] = true
    
    if (isCorrect) {
      showToast('Excellent! You mastered this concept!', 'success')
    } else {
      showToast('Not quite right. Try again!', 'error')
    }
  } finally {
    submittingFollowUp.value = null
  }
}

const resetFollowUpExercise = (exerciseId) => {
  followUpAnswers.value[exerciseId] = ''
  showFollowUpResults.value[exerciseId] = false
  followUpResults.value[exerciseId] = null
}

const getExerciseTypeName = (type) => {
  const types = {
    'multiple-choice': 'Multiple Choice',
    'fill-blank': 'Fill in the Blank',
    'true-false': 'True/False',
    'short-answer': 'Short Answer'
  }
  return types[type] || 'Exercise'
}

const getSubmitButtonText = (exerciseId) => {
  if (submittingAnswer.value === exerciseId) return 'Checking...'
  if (exerciseResults.value[exerciseId]?.is_correct && showResults.value[exerciseId]) return 'Completed'
  return 'Check Answer'
}

const getFollowUpSubmitButtonText = (exerciseId) => {
  if (submittingFollowUp.value === exerciseId) return 'Checking...'
  if (followUpResults.value[exerciseId]?.is_correct && showFollowUpResults.value[exerciseId]) return 'Completed'
  return 'Check Follow-up Answer'
}

const getCorrectAnswerText = (exercise) => {
  if (exercise.type === 'multiple-choice') {
    return exercise.options[exercise.correct]
  } else if (exercise.type === 'fill-blank') {
    return exercise.correct
  } else if (exercise.type === 'true-false') {
    return exercise.correct
  }
  return exercise.correct
}

const getFollowUpQuestion = (exercise) => {
  if (exercise.follow_up && exercise.follow_up.question) {
    return exercise.follow_up.question
  }
  
  // Generate auto follow-up for multiple choice
  if (exercise.type === 'multiple-choice' && exercise.options) {
    const correctAnswer = exercise.options[exercise.correct]
    const question = exercise.question
    return `Complete this sentence: The correct answer to "${question.substring(0, 50)}..." is _______.`
  }
  
  return 'Follow-up question not available.'
}

const getFollowUpCorrectAnswer = (exercise) => {
  if (exercise.follow_up && exercise.follow_up.correct_answer) {
    return exercise.follow_up.correct_answer
  }
  
  // Auto-generated correct answer for multiple choice
  if (exercise.type === 'multiple-choice' && exercise.options) {
    return exercise.options[exercise.correct]
  }
  
  return ''
}

const isFollowUpAnswerCorrect = (exercise) => {
  const answer = followUpAnswers.value[exercise.id]
  const correctAnswer = getFollowUpCorrectAnswer(exercise)
  return answer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim()
}

const getFollowUpExplanation = (exercise) => {
  if (exercise.follow_up && exercise.follow_up.explanation) {
    return exercise.follow_up.explanation
  }
  
  const isCorrect = followUpResults.value[exercise.id]?.is_correct
  const correctAnswer = getFollowUpCorrectAnswer(exercise)
  
  if (isCorrect) {
    return `Perfect! You correctly identified "${correctAnswer}" as the answer. This shows you understand the concept well.`
  } else {
    return `The correct answer is "${correctAnswer}". Review the explanation above to better understand this concept.`
  }
}
</script>

<style scoped>
.exercises-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header i {
  margin-right: 0.75rem;
  font-size: 1.25rem;
  color: #3182ce;
}

.section-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #2d3748;
}

.exercise-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.exercise-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.exercise-header {
  background: #f7fafc;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exercise-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 1.125rem;
  font-weight: 600;
}

.exercise-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.exercise-status .correct {
  color: #38a169;
}

.exercise-status .incorrect {
  color: #e53e3e;
}

.exercise-content {
  padding: 1.5rem;
}

.exercise-question {
  font-size: 1.125rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-weight: 500;
}

.multiple-choice .option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.multiple-choice .option:hover:not(.disabled) {
  border-color: #3182ce;
  background: #ebf8ff;
}

.multiple-choice .option.selected {
  border-color: #3182ce;
  background: #ebf8ff;
}

.multiple-choice .option.correct {
  border-color: #38a169;
  background: #f0fff4;
  color: #22543d;
}

.multiple-choice .option.incorrect {
  border-color: #e53e3e;
  background: #fed7d7;
  color: #742a2a;
}

.multiple-choice .option.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.option-indicator {
  margin-right: 1rem;
  font-size: 1.125rem;
  color: #3182ce;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  line-height: 1.5;
}

.fill-blank .blank-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.fill-blank .blank-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.fill-blank .blank-input.correct {
  border-color: #38a169;
  background: #f0fff4;
}

.fill-blank .blank-input.incorrect {
  border-color: #e53e3e;
  background: #fed7d7;
}

.true-false .tf-options {
  display: flex;
  gap: 1rem;
}

.tf-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tf-option:hover {
  border-color: #3182ce;
  background: #ebf8ff;
}

.tf-option.selected {
  border-color: #3182ce;
  background: #ebf8ff;
}

.tf-option.correct {
  border-color: #38a169;
  background: #f0fff4;
  color: #22543d;
}

.tf-option.incorrect {
  border-color: #e53e3e;
  background: #fed7d7;
  color: #742a2a;
}

.tf-option input[type="radio"] {
  margin-right: 0.5rem;
}

.tf-text {
  font-weight: 600;
  font-size: 1rem;
}

.exercise-actions {
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
}

.check-btn, .try-again-btn {
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.check-btn:hover:not(:disabled), .try-again-btn:hover {
  background: #2c5282;
  transform: translateY(-1px);
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.check-btn.submitted {
  background: #38a169;
}

.try-again-btn {
  background: #ed8936;
}

.try-again-btn:hover {
  background: #dd6b20;
}

.followup-btn {
  background: #805ad5;
}

.followup-btn:hover:not(:disabled) {
  background: #6b46c1;
}

.exercise-result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.exercise-result.correct {
  background: #f0fff4;
  border-left-color: #38a169;
  color: #22543d;
}

.exercise-result.incorrect {
  background: #fed7d7;
  border-left-color: #e53e3e;
  color: #742a2a;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
}

.result-header i {
  font-size: 1.125rem;
}

.explanation {
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
  font-size: 0.95rem;
}

.correct-answer-hint {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.correct-answer-hint small {
  font-size: 0.85rem;
  opacity: 0.8;
}

.followup-exercise {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #faf5ff;
  border: 1px solid #e9d8fd;
  border-radius: 8px;
}

.followup-header h5 {
  margin: 0 0 1rem 0;
  color: #553c9a;
  font-size: 1rem;
  font-weight: 600;
}
</style>