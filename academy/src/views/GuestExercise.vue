<!-- src/components/guest/GuestExercise.vue -->
<template>
  <div class="guest-exercise">
    <div class="exercise-content">
      <!-- Multiple Choice -->
      <div v-if="exerciseType === 'multiple-choice'" class="multiple-choice-exercise">
        <div class="question">{{ currentQuestion.question }}</div>
        <div class="options">
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            :class="['option', { 'selected': selectedAnswer === index }]"
            @click="selectOption(index)"
          >
            <div class="option-indicator">
              <i :class="selectedAnswer === index ? 'fas fa-dot-circle' : 'far fa-circle'"></i>
            </div>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>
      </div>

      <!-- Fill in the Blank -->
      <div v-else-if="exerciseType === 'fill-blank'" class="fill-blank-exercise">
        <div class="question">{{ currentQuestion.question }}</div>
        <input
          v-model="selectedAnswer"
          type="text"
          placeholder="Type your answer here..."
          class="blank-input"
        />
      </div>

      <!-- True/False -->
      <div v-else-if="exerciseType === 'true-false'" class="true-false-exercise">
        <div class="question">{{ currentQuestion.question }}</div>
        <div class="options">
          <div
            v-for="(option, index) in ['True', 'False']"
            :key="index"
            :class="['option', { 'selected': selectedAnswer === index }]"
            @click="selectOption(index)"
          >
            <div class="option-indicator">
              <i :class="selectedAnswer === index ? 'fas fa-dot-circle' : 'far fa-circle'"></i>
            </div>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>
      </div>

      <!-- Paragraph -->
      <div v-else-if="exerciseType === 'paragraph'" class="paragraph-exercise">
        <div class="question">{{ currentQuestion.question }}</div>
        <textarea
          v-model="selectedAnswer"
          placeholder="Share your thoughts..."
          class="paragraph-input"
          rows="6"
        ></textarea>
        <div class="word-count">
          Words: {{ wordCount }}
        </div>
      </div>

      <!-- Submit Button -->
      <button
        @click="submitAnswer"
        :disabled="!hasValidAnswer"
        class="submit-btn"
      >
        Check Answer
      </button>

      <!-- Result -->
      <div v-if="showResult" class="exercise-result">
        <div :class="['result-message', { 'correct': isCorrect, 'incorrect': !isCorrect }]">
          <i :class="isCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
          <span>{{ isCorrect ? 'Correct!' : 'Incorrect' }}</span>
        </div>
        <div v-if="!isCorrect && currentQuestion.explanation" class="explanation">
          {{ currentQuestion.explanation }}
        </div>
        <div v-if="!isCorrect && currentQuestion.correct !== undefined" class="correct-answer">
          Correct answer: {{ getCorrectAnswerText() }}
        </div>
      </div>
    </div>

    <div class="guest-notice">
      <i class="fas fa-info-circle"></i>
      <p>Register to save your progress and access all exercises</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  exercise: {
    type: [Object, Array],
    required: true
  },
  lessonId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['exercise-completed']);

const selectedAnswer = ref(null);
const showResult = ref(false);
const isCorrect = ref(false);
const currentQuestion = ref({});

const exerciseType = computed(() => {
  if (Array.isArray(props.exercise)) {
    return props.exercise[0]?.type || 'multiple-choice';
  }
  return props.exercise.type || 'multiple-choice';
});

const hasValidAnswer = computed(() => {
  if (selectedAnswer.value === null || selectedAnswer.value === undefined) return false;

  if (exerciseType.value === 'paragraph') {
    return selectedAnswer.value.trim().length > 0;
  }

  if (exerciseType.value === 'fill-blank') {
    return selectedAnswer.value.trim().length > 0;
  }

  return true;
});

const wordCount = computed(() => {
  if (!selectedAnswer.value) return 0;
  return selectedAnswer.value.trim().split(/\s+/).filter(word => word.length > 0).length;
});

const initializeExercise = () => {
  if (Array.isArray(props.exercise)) {
    currentQuestion.value = props.exercise[0] || {};
  } else {
    currentQuestion.value = props.exercise;
  }

  // Set default values for the question
  if (!currentQuestion.value.type) {
    currentQuestion.value.type = exerciseType.value;
  }
};

const selectOption = (index) => {
  selectedAnswer.value = index;
};

const submitAnswer = () => {
  if (!hasValidAnswer.value) return;

  // Check if answer is correct
  if (exerciseType.value === 'multiple-choice' || exerciseType.value === 'true-false') {
    isCorrect.value = selectedAnswer.value === currentQuestion.value.correct;
  } else if (exerciseType.value === 'fill-blank') {
    const userAnswer = selectedAnswer.value.toString().toLowerCase().trim();
    const correctAnswer = currentQuestion.value.correct?.toString().toLowerCase().trim();
    isCorrect.value = userAnswer === correctAnswer;
  } else if (exerciseType.value === 'paragraph') {
    // For paragraph questions, we'll consider any answer as "correct" for guest mode
    isCorrect.value = true;
  }

  showResult.value = true;

  // Emit completion event
  emit('exercise-completed', {
    lessonId: props.lessonId,
    questionId: currentQuestion.value.id,
    isCorrect: isCorrect.value,
    userAnswer: selectedAnswer.value,
    correctAnswer: currentQuestion.value.correct
  });
};

const getCorrectAnswerText = () => {
  if (exerciseType.value === 'multiple-choice' || exerciseType.value === 'true-false') {
    if (currentQuestion.value.options && currentQuestion.value.correct !== undefined) {
      return currentQuestion.value.options[currentQuestion.value.correct];
    }
  }
  return currentQuestion.value.correct;
};

onMounted(() => {
  initializeExercise();
});
</script>

<style scoped>
.guest-exercise {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
}

.question {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option:hover {
  border-color: var(--primary-color);
}

.option.selected {
  border-color: var(--primary-color);
  background-color: #f0f8ff;
}

.option-indicator {
  color: var(--primary-color);
}

.blank-input, .paragraph-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.paragraph-input {
  resize: vertical;
  min-height: 120px;
}

.word-count {
  text-align: right;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.submit-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.exercise-result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 5px;
}

.result-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.result-message.correct {
  color: #4CAF50;
}

.result-message.incorrect {
  color: #f44336;
}

.explanation, .correct-answer {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.guest-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
</style>