<template>
  <section class="hero-section" ref="heroSection">
    <div class="hero-wrapper" :class="{ 'animate-in': isHeroAnimated }">
      <h2 class="hero-title">Build Wealth And A Healthy Mind</h2>
      <p class="hero-subtitle">
        Brick by brick, with purpose and consistency — rise above the noise.
      </p>

      <!-- Updated Search Container -->
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            type="text"
            v-model="searchInput"
            class="search-input"
            :class="{ 'focus-active': isSearchFocused }"
            :placeholder="currentPlaceholder"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            @keypress.enter="performSearch"
          />
          <div class="search-icon" @click="performSearch">
            <i class="fas fa-search"></i>
          </div>
        </div>

        <!-- Updated search suggestions dropdown -->
        <div v-if="showSuggestions && searchStore" class="search-suggestions-dropdown">
          <div v-if="searchStore.recentSearches.length > 0" class="suggestion-section">
            <h4>Recent Searches</h4>
            <div
              class="suggestion-item"
              v-for="search in searchStore.recentSearches"
              :key="search"
              @click="handleQuickSearch(search)"
            >
              <i class="fas fa-history suggestion-icon"></i>
              <span>{{ search }}</span>
              <button
                class="remove-search-btn"
                @mousedown.prevent
                @click.stop="removeRecentSearch(search)"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="suggestion-section">
            <h4>Popular Searches</h4>
            <div class="suggestion-item" @click="handleQuickSearch('financial literacy')">
              <i class="fas fa-chart-line suggestion-icon"></i>
              <span>Financial Literacy</span>
            </div>
            <div class="suggestion-item" @click="handleQuickSearch('discipline habits')">
              <i class="fas fa-brain suggestion-icon"></i>
              <span>Discipline & Habits</span>
            </div>
            <div class="suggestion-item" @click="handleQuickSearch('entrepreneurship')">
              <i class="fas fa-briefcase suggestion-icon"></i>
              <span>Entrepreneurship</span>
            </div>
            <div class="suggestion-item" @click="handleQuickSearch('budgeting')">
              <i class="fas fa-money-bill-wave suggestion-icon"></i>
              <span>Budgeting</span>
            </div>
            <div class="suggestion-item" @click="handleQuickSearch('productivity')">
              <i class="fas fa-rocket suggestion-icon"></i>
              <span>Productivity</span>
            </div>
          </div>
        </div>
      </div>

      <button class="get-started-btn" @click="performSearch">Explore Courses</button>
    </div>
  </section>

  <!-- Popular Courses Section -->
  <section class="popular-courses">
    <div class="container">
      <h2 class="section-title">Most Popular Courses</h2>
      <p class="section-subtitle">Join thousands of students in our most enrolled courses</p>

      <!-- Popular Courses Section - Original Version -->
      <div v-if="!loading && !error && popularCourses.length > 0" class="courses-grid">
        <div class="course-col" v-for="course in popularCourses" :key="course.id">
          <div class="course-card">
            <div class="course-card-header">
              <h3 class="course-card-title">{{ course.title }}</h3>
              <span v-if="course.is_new" class="course-tag new">New</span>
              <span class="course-code">{{ course.code }}</span>
            </div>
            <p class="course-card-content">{{ shortenDescription(course.description) }}</p>
            <div class="course-meta">
              <span><i class="fas fa-clock"></i> {{ course.duration }} weeks</span>
              <span class="course-price free"> <i class="fas fa-gift"></i> Free </span>
            </div>
            <div class="course-actions">
              <!-- Continue Button (for enrolled courses) -->
              <button
                v-if="isCourseEnrolled(course)"
                class="view-course-btn continue-btn"
                @click="viewCourse(course)"
              >
                Continue
              </button>

              <!-- View Course Button (for non-enrolled courses) -->
              <button v-else class="view-course-btn" @click="viewCourse(course)">
                View Course
              </button>

              <!-- Enrolled Button (disabled, for enrolled courses) -->
              <button v-if="isCourseEnrolled(course)" class="enroll-btn" disabled>Enrolled</button>

              <!-- Enroll Now Button (for non-enrolled courses) -->
              <button
                v-else
                class="enroll-btn"
                @click="handleEnrollNow(course)"
                :disabled="isEnrolling && currentEnrollingCourse === course.id"
              >
                <span v-if="isEnrolling && currentEnrollingCourse === course.id">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                <span v-else> Enroll Now </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading popular courses...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Unable to Load Popular Courses</h3>
          <p>{{ error }}</p>
          <div class="error-actions">
            <button @click="loadPopularCourses" class="retry-btn">
              <i class="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !error && popularCourses.length === 0" class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No popular courses available</h3>
        <p>There are no popular courses available at the moment.</p>
        <button @click="loadPopularCourses" class="retry-btn">
          <i class="fas fa-redo"></i>
          Check Again
        </button>
      </div>

      <div v-if="!loading && !error" class="more-courses-container">
        <router-link to="/courses" class="more-courses-btn get-started-btn">
          <i class="fas fa-book"></i>
          Explore More Courses
        </router-link>
      </div>
    </div>
  </section>

  <!-- FIXED Comments Section -->
  <section class="comments-section">
    <div class="container">
      <h2 class="section-title">Community Feedback</h2>
      <p class="section-subtitle">
        Real experiences from our learners - the good, the honest, and the transformative
      </p>

      <!-- Comments Loading State -->
      <div v-if="commentsLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading comments...</p>
      </div>

      <!-- Comments Error State -->
      <div v-else-if="commentsError" class="error-state">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Unable to Load Comments</h3>
          <p>{{ commentsError }}</p>
          <div class="error-actions">
            <button @click="loadComments" class="retry-btn">
              <i class="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Comments Content -->
      <div v-else class="comments-card">
        <div class="comments-list">
          <div
            class="comment-item"
            v-for="comment in visibleComments"
            :key="comment.id"
            v-click-outside="() => closeAllMenus()"
          >
            <!-- Comment Header - Fixed click handling -->
            <div class="comment-header">
              <div class="user-avatar" :style="{ backgroundColor: getRandomColor() }">
                {{ getUserInitial(comment) }}
              </div>
              <div class="user-info">
                <h4 class="user-name">{{ getUserName(comment) }}</h4>
                <div class="course-tag">{{ comment.course }}</div>
              </div>
              <div class="comment-date">
                {{ comment.date }}
                <span v-if="comment.edited" class="edited-badge">(edited)</span>
              </div>

              <!-- Comment Actions Menu - Fixed with better event handling -->
              <div
                v-if="comment.can_edit || comment.can_delete"
                class="comment-actions-menu"
                @click.stop
              >
                <button
                  class="menu-trigger"
                  @click="toggleCommentMenu(comment.id, $event)"
                  :aria-label="'Comment options for ' + getUserName(comment)"
                >
                  <i class="fas fa-ellipsis-v"></i>
                </button>

                <!-- Menu Dropdown -->
                <div v-if="comment.showMenu" class="menu-dropdown" @click.stop>
                  <button
                    v-if="comment.can_edit"
                    class="menu-item edit-btn"
                    @click="startEditComment(comment)"
                  >
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button
                    v-if="comment.can_delete"
                    class="menu-item delete-btn"
                    @click="confirmDeleteComment(comment.id)"
                  >
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Comment Content - View Mode -->
            <div v-if="!comment.editing" class="comment-content">
              <p>{{ comment.content }}</p>
            </div>

            <!-- Comment Content - Edit Mode -->
            <div v-else class="comment-edit-form">
              <textarea
                v-model="comment.editContent"
                class="edit-textarea"
                rows="3"
                maxlength="500"
                placeholder="Edit your comment..."
              ></textarea>
              <div class="edit-actions">
                <button class="cancel-edit-btn" @click="cancelEditComment(comment)">Cancel</button>
                <button
                  class="save-edit-btn"
                  @click="saveEditComment(comment)"
                  :disabled="!comment.editContent.trim()"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div class="comment-actions">
              <div class="action-buttons">
                <button
                  class="action-btn like-btn"
                  @click="toggleLike(comment.id)"
                  :class="{ liked: comment.liked }"
                >
                  <i class="fas fa-heart"></i>
                  <span class="action-count">{{ comment.likes }}</span>
                </button>
                <button
                  class="action-btn dislike-btn"
                  @click="toggleDislike(comment.id)"
                  :class="{ disliked: comment.disliked }"
                >
                  <i class="fas fa-thumbs-down"></i>
                  <span class="action-count">{{ comment.dislikes }}</span>
                </button>
                <button class="action-btn reply-btn" @click="toggleReply(comment.id)">
                  <i class="fas fa-reply"></i>
                  <span>Reply</span>
                </button>
              </div>
            </div>

            <!-- Reply Form -->
            <div class="reply-form" v-if="comment.showReply">
              <div class="reply-avatar">
                {{
                  (authStore.user?.first_name?.charAt(0) || 'Y') +
                  (authStore.user?.last_name?.charAt(0) || 'U')
                }}
              </div>
              <div class="reply-input-container">
                <input
                  type="text"
                  v-model="comment.replyText"
                  placeholder="Write your reply..."
                  class="reply-input"
                  @keypress.enter="submitReply(comment.id)"
                />
                <button class="submit-reply-btn" @click="submitReply(comment.id)">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>

            <!-- Replies Section -->
            <div class="replies-section" v-if="comment.replies && comment.replies.length > 0">
              <div class="replies-header" @click="toggleReplies(comment.id)">
                <span class="replies-toggle">
                  <i
                    class="fas"
                    :class="comment.showReplies ? 'fa-chevron-up' : 'fa-chevron-down'"
                  ></i>
                </span>
                <span class="replies-count"
                  >{{ comment.replies.length }}
                  {{ comment.replies.length === 1 ? 'reply' : 'replies' }}</span
                >
              </div>

              <div class="replies-list" v-if="comment.showReplies">
                <div class="reply-item" v-for="reply in comment.replies" :key="reply.id">
                  <div class="reply-header">
                    <div class="reply-avatar small">
                      {{ getReplyInitial(reply) }}
                    </div>
                    <div class="reply-content">
                      <div class="reply-user">{{ getReplyName(reply) }}</div>

                      <!-- Reply Content - View Mode -->
                      <div v-if="!reply.editing" class="reply-text">
                        {{ reply.text || reply.content }}
                        <span v-if="reply.edited" class="edited-badge small">(edited)</span>
                      </div>

                      <!-- Reply Content - Edit Mode -->
                      <div v-else class="reply-edit-form">
                        <input
                          type="text"
                          v-model="reply.editContent"
                          class="edit-reply-input"
                          placeholder="Edit your reply..."
                          @keypress.enter="saveEditReply(reply, comment.id)"
                        />
                        <div class="reply-edit-actions">
                          <button class="cancel-edit-btn small" @click="cancelEditReply(reply)">
                            Cancel
                          </button>
                          <button
                            class="save-edit-btn small"
                            @click="saveEditReply(reply, comment.id)"
                            :disabled="!reply.editContent.trim()"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      <div class="reply-date">{{ reply.date }}</div>

                      <!-- Reply Actions (Like, Dislike, Reply) - Only for parent replies -->
                      <div class="reply-actions" v-if="!reply.parent_reply">
                        <div class="action-buttons">
                          <button
                            class="action-btn like-btn"
                            @click="toggleReplyLike(reply.id, comment.id)"
                            :class="{ liked: reply.liked }"
                          >
                            <i class="fas fa-heart"></i>
                            <span class="action-count">{{ reply.likes || 0 }}</span>
                          </button>
                          <button
                            class="action-btn dislike-btn"
                            @click="toggleReplyDislike(reply.id, comment.id)"
                            :class="{ disliked: reply.disliked }"
                          >
                            <i class="fas fa-thumbs-down"></i>
                            <span class="action-count">{{ reply.dislikes || 0 }}</span>
                          </button>
                          <button
                            class="action-btn reply-btn"
                            @click="toggleNestedReply(reply.id, comment.id)"
                          >
                            <i class="fas fa-reply"></i>
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Reply Actions Menu - Fixed click handling -->
                    <div
                      v-if="reply.can_edit || reply.can_delete"
                      class="reply-actions-menu"
                      @click.stop
                    >
                      <button
                        class="menu-trigger small"
                        @click="toggleReplyMenu(reply.id, comment.id)"
                        :aria-label="'Reply options for ' + getReplyName(reply)"
                      >
                        <i class="fas fa-ellipsis-v"></i>
                      </button>

                      <!-- Menu Dropdown -->
                      <div v-if="reply.showMenu" class="menu-dropdown" @click.stop>
                        <button
                          v-if="reply.can_edit"
                          class="menu-item edit-btn"
                          @click="startEditReply(reply, comment.id)"
                        >
                          <i class="fas fa-edit"></i> Edit
                        </button>
                        <button
                          v-if="reply.can_delete"
                          class="menu-item delete-btn"
                          @click="confirmDeleteReply(reply.id, comment.id)"
                        >
                          <i class="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Nested Reply Form -->
                  <div
                    class="nested-reply-form"
                    v-if="reply.showNestedReply && !reply.parent_reply"
                  >
                    <div class="reply-avatar smaller">
                      {{
                        (authStore.user?.first_name?.charAt(0) || 'Y') +
                        (authStore.user?.last_name?.charAt(0) || 'U')
                      }}
                    </div>
                    <div class="reply-input-container">
                      <input
                        type="text"
                        v-model="reply.nestedReplyText"
                        placeholder="Write your reply..."
                        class="reply-input"
                        @keypress.enter="submitNestedReply(reply.id, comment.id)"
                      />
                      <button
                        class="submit-reply-btn"
                        @click="submitNestedReply(reply.id, comment.id)"
                      >
                        <i class="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Nested Replies Display with Toggle -->
                  <div
                    class="nested-replies-container"
                    v-if="reply.nestedReplies && reply.nestedReplies.length > 0"
                  >
                    <div
                      class="nested-replies-header"
                      @click="toggleNestedReplies(reply.id, comment.id)"
                    >
                      <span class="nested-replies-toggle">
                        <i
                          class="fas"
                          :class="reply.showNestedReplies ? 'fa-chevron-up' : 'fa-chevron-down'"
                        ></i>
                      </span>
                      <span class="nested-replies-count">
                        {{ reply.nestedReplies.length }}
                        {{ reply.nestedReplies.length === 1 ? 'reply' : 'replies' }}
                      </span>
                    </div>

                    <div class="nested-replies-list" v-if="reply.showNestedReplies">
                      <div
                        class="nested-reply-item"
                        v-for="nestedReply in reply.nestedReplies"
                        :key="nestedReply.id"
                      >
                        <div class="nested-reply-header">
                          <div class="reply-avatar smallest">
                            {{ getReplyInitial(nestedReply) }}
                          </div>
                          <div class="nested-reply-content">
                            <div class="nested-reply-meta">
                              <span class="nested-reply-user">{{ getReplyName(nestedReply) }}</span>
                              <span class="nested-reply-date">{{ nestedReply.date }}</span>
                            </div>
                            <div class="nested-reply-text">
                              {{ nestedReply.text || nestedReply.content }}
                            </div>

                            <!-- NO BUTTONS FOR NESTED REPLIES - Requirement: Child replies cannot have like/dislike/reply buttons -->
                          </div>

                          <!-- Nested Reply Actions Menu (Edit/Delete only for owner) -->
                          <div
                            v-if="nestedReply.can_edit || nestedReply.can_delete"
                            class="nested-reply-actions-menu"
                            @click.stop
                          >
                            <button
                              class="menu-trigger smallest"
                              @click="toggleNestedReplyMenu(nestedReply.id, reply.id, comment.id)"
                              :aria-label="'Reply options for ' + getReplyName(nestedReply)"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </button>

                            <div v-if="nestedReply.showMenu" class="menu-dropdown" @click.stop>
                              <button
                                v-if="nestedReply.can_edit"
                                class="menu-item edit-btn"
                                @click="startEditNestedReply(nestedReply, reply.id, comment.id)"
                              >
                                <i class="fas fa-edit"></i> Edit
                              </button>
                              <button
                                v-if="nestedReply.can_delete"
                                class="menu-item delete-btn"
                                @click="
                                  confirmDeleteNestedReply(nestedReply.id, reply.id, comment.id)
                                "
                              >
                                <i class="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Nested Reply Edit Form -->
                        <div class="nested-reply-edit-form" v-if="nestedReply.editing">
                          <input
                            type="text"
                            v-model="nestedReply.editContent"
                            class="edit-reply-input"
                            placeholder="Edit your reply..."
                            @keypress.enter="saveEditNestedReply(nestedReply, reply.id, comment.id)"
                          />
                          <div class="nested-reply-edit-actions">
                            <button
                              class="cancel-edit-btn small"
                              @click="cancelEditNestedReply(nestedReply)"
                            >
                              Cancel
                            </button>
                            <button
                              class="save-edit-btn small"
                              @click="saveEditNestedReply(nestedReply, reply.id, comment.id)"
                              :disabled="!nestedReply.editContent.trim()"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Separator between comments (except last) -->
            <div
              class="comment-separator"
              v-if="comment.id !== visibleComments[visibleComments.length - 1]?.id"
            ></div>
          </div>
        </div>

        <!-- Load More Comments -->
        <div class="load-more-section" v-if="visibleComments.length < comments.length">
          <button class="load-more-btn" @click="loadMoreComments">
            Load More Comments ({{ comments.length - visibleComments.length }} remaining)
          </button>
        </div>
      </div>

      <!-- Add Comment Section -->
      <div class="add-comment-section">
        <h3 class="comment-form-title">Share Your Learning Experience</h3>
        <p class="form-subtitle">
          Your honest feedback helps us improve and helps others make informed decisions
        </p>

        <!-- Courses Loading State -->
        <div v-if="coursesLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>

        <!-- Courses Error State -->
        <div v-else-if="coursesError" class="error-state">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Unable to Load Courses</h3>
            <p>{{ coursesError }}</p>
            <div class="error-actions">
              <button @click="loadAllCourses" class="retry-btn">
                <i class="fas fa-redo"></i>
                Try Again
              </button>
            </div>
          </div>
        </div>

        <!-- Comment Form -->
        <form v-else @submit.prevent="submitComment" class="comment-form">
          <div class="form-row">
            <div class="form-group">
              <label for="userName">Your Name</label>
              <input
                type="text"
                id="userName"
                :value="
                  authStore.isAuthenticated
                    ? authStore.user?.first_name + ' ' + authStore.user?.last_name
                    : ''
                "
                required
                placeholder="Enter your name"
                disabled
                class="disabled-input"
              />
            </div>
            <div class="form-group">
              <label for="courseSelect">Course Taken</label>
              <select
                id="courseSelect"
                v-model="newComment.course"
                required
                :disabled="!authStore.isAuthenticated"
                class="course-select"
              >
                <option value="" disabled>Select a course</option>

                <!-- Show enrolled courses first for authenticated users -->
                <template v-if="authStore.isAuthenticated">
                  <optgroup v-if="getEnrolledCourses.length > 0">
                    <option
                      v-for="course in getEnrolledCourses"
                      :key="course.id"
                      :value="course.id"
                    >
                      {{ course.title }}
                      <span v-if="course.enrollment_status">({{ course.enrollment_status }})</span>
                    </option>
                  </optgroup>

                  <optgroup v-else label="Available Courses">
                    <option v-for="course in allCourses" :key="course.id" :value="course.id">
                      {{ course.title }}
                    </option>
                  </optgroup>
                </template>

                <!-- For non-authenticated users, show all courses -->
                <template v-else>
                  <option v-for="course in allCourses" :key="course.id" :value="course.id">
                    {{ course.title }}
                  </option>
                </template>
              </select>

              <!-- Helper text -->
              <small class="form-helper">
                <span v-if="authStore.isAuthenticated && getEnrolledCourses.length === 0">
                  You need to be enrolled in a course to comment.
                  <router-link to="/student/courses">Browse courses</router-link>
                </span>
                <span v-else-if="!authStore.isAuthenticated">
                  Please login to select a course and comment
                </span>
              </small>
            </div>
          </div>

          <div class="form-group">
            <label for="commentText">Your Experience</label>
            <textarea
              id="commentText"
              v-model="newComment.content"
              required
              placeholder="Share your honest experience with this course - what worked, what didn't, and how it impacted your journey..."
              rows="4"
              maxlength="500"
              :disabled="!authStore.isAuthenticated"
            ></textarea>
            <div class="char-count">{{ newComment.content.length }}/500</div>
          </div>

          <button
            type="submit"
            class="submit-comment-btn"
            :disabled="!authStore.isAuthenticated || !newComment.course || coursesLoading"
          >
            <i class="fas fa-share"></i>
            <template v-if="!authStore.isAuthenticated"> Please Login to Comment </template>
            <template v-else-if="!newComment.course"> Please Select a Course </template>
            <template v-else-if="getEnrolledCourses.length === 0">
              Enroll in a Course to Comment
            </template>
            <template v-else> Share Your Feedback </template>
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useSearchStore } from '@/stores/search'
import { useToast } from 'vue-toastification'
import { useEnrollment } from '@/composables/useEnrollment'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const guestStore = useGuestStore()
const searchStore = useSearchStore()
const toast = useToast()
const { enrollCourse, isEnrolling } = useEnrollment()

// Existing reactive data
const isHeroAnimated = ref(false)
const isSearchFocused = ref(false)
const searchInput = ref('')
const currentPlaceholder = ref('')
const placeholderIndex = ref(0)
const heroSection = ref(null)
const commentsToShow = ref(3)

// Popular courses data
const popularCourses = ref([])
const loading = ref(false)
const error = ref(null)
const currentEnrollingCourse = ref(null)
const enrollmentStatuses = ref({})

// Search suggestions
const showSuggestions = ref(false)

// Comments data - REAL DATA ONLY
const comments = ref([])
const commentsLoading = ref(false)
const commentsError = ref(null)

// ✅ ADD THESE: Course dropdown data
const allCourses = ref([])
const coursesLoading = ref(false)
const coursesError = ref(null)

// New comment form
const newComment = ref({
  user: '',
  course: '',
  content: '',
  rating: 5,
})

// Constants
const searchPlaceholder = 'Search for courses, lessons, or topics...'
let placeholderInterval = null

// Computed properties
const visibleComments = computed(() => {
  return comments.value.slice(0, commentsToShow.value)
})

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Fixed description shortening function
const shortenDescription = (description) => {
  if (!description) return 'No description available.'
  if (description.length > 75) {
    return description.substring(0, 75).trim() + '...'
  }
  return description
}

const loadAllCourses = async () => {
  coursesLoading.value = true
  coursesError.value = null

  try {
    console.log('📚 Loading all courses for comment form...')

    let response

    // Try to get courses with enrollment data for authenticated users
    if (authStore.isAuthenticated) {
      try {
        response = await axios.get('/api/student/courses/', {
          headers: {
            Authorization: `Bearer ${authStore.accessToken}`,
          },
        })
        console.log('✅ Loaded courses with enrollment data')
      } catch (error) {
        console.log('⚠️ Could not load enrolled courses, falling back to home courses')
        response = await axios.get('/api/student/home/courses/')
      }
    } else {
      response = await axios.get('/api/student/home/courses/')
    }

    if (response.data && response.data.courses) {
      allCourses.value = response.data.courses.map((course) => ({
        ...course,
        // Ensure id is a number
        id: parseInt(course.id),
        // Ensure enrollment_status is set
        enrollment_status: course.enrollment_status || 'not_enrolled',
      }))
      console.log('✅ Loaded courses for dropdown:', allCourses.value.length)
    } else {
      console.log('⚠️ No courses found in response')
      // Fallback to popular courses
      allCourses.value =
        popularCourses.value.length > 0 ? popularCourses.value : getFallbackCourses()
    }
  } catch (error) {
    console.error('❌ Failed to load courses for dropdown:', error)
    coursesError.value = 'Failed to load courses'

    // Fallback to popular courses
    allCourses.value = popularCourses.value.length > 0 ? popularCourses.value : getFallbackCourses()
  } finally {
    coursesLoading.value = false
  }
}

const getFallbackCourses = () => {
  return [
    {
      id: 1,
      title: 'Financial Literacy',
      description: 'Master budgeting, saving, and debt management',
      enrollment_status: 'not_enrolled',
    },
    {
      id: 2,
      title: 'Discipline, Habits & Focus',
      description: 'Create sustainable routines and break procrastination',
      enrollment_status: 'not_enrolled',
    },
    {
      id: 3,
      title: 'Entrepreneurship Fundamentals',
      description: 'Learn to register a business and find customers',
      enrollment_status: 'not_enrolled',
    },
  ]
}

// Also add the helper function to get enrolled courses
const getEnrolledCourses = computed(() => {
  if (!authStore.isAuthenticated) {
    return allCourses.value
  }

  // Filter courses where user is enrolled
  return allCourses.value.filter(
    (course) =>
      course.enrollment_status === 'approved' ||
      course.enrollment_status === 'completed' ||
      course.is_enrolled,
  )
})

// Helper function to get course title by ID
const getCourseTitleById = (courseId) => {
  const course =
    allCourses.value.find((c) => c.id === courseId) ||
    popularCourses.value.find((c) => c.id === courseId)
  return course ? course.title : 'Unknown Course'
}

// FIXED: Safe user data handling methods
const getUserName = (comment) => {
  try {
    // If user is already a string, return it
    if (typeof comment.user === 'string') {
      return comment.user
    }

    // If user is an object with name properties
    if (comment.user_data?.first_name && comment.user_data?.last_name) {
      return `${comment.user_data.first_name} ${comment.user_data.last_name}`
    }

    if (comment.user_data?.user_name) {
      return comment.user_data.user_name
    }

    // If user object has direct properties
    if (comment.user?.first_name && comment.user?.last_name) {
      return `${comment.user.first_name} ${comment.user.last_name}`
    }

    if (comment.user?.user_name) {
      return comment.user.user_name
    }

    // Fallback to auth store if available
    if (authStore.user?.first_name && authStore.user?.last_name) {
      return `${authStore.user.first_name} ${authStore.user.last_name}`
    }

    return 'Unknown User'
  } catch (e) {
    console.error('Error getting user name:', e)
    return 'Unknown User'
  }
}

const extractUserName = (comment) => {
  try {
    // If user is already a string
    if (typeof comment.user === 'string') {
      return comment.user
    }

    // If user_name field exists
    if (comment.user_name) {
      return comment.user_name
    }

    // If user object has name properties
    if (comment.user?.first_name && comment.user?.last_name) {
      return `${comment.user.first_name} ${comment.user.last_name}`
    }

    if (comment.user?.user_name) {
      return comment.user.user_name
    }

    return 'Unknown User'
  } catch (e) {
    console.error('Error extracting user name:', e)
    return 'Unknown User'
  }
}

const getUserInitial = (comment) => {
  try {
    // If user is already a string, use first character
    if (typeof comment.user === 'string') {
      return comment.user.charAt(0).toUpperCase()
    }

    // If user is an object with name properties
    if (comment.user_data?.first_name) {
      const first = comment.user_data.first_name.charAt(0).toUpperCase()
      const last = comment.user_data.last_name
        ? comment.user_data.last_name.charAt(0).toUpperCase()
        : ''
      return first + last
    }

    if (comment.user_data?.user_name) {
      return comment.user_data.user_name.charAt(0).toUpperCase()
    }

    // If user object has direct properties
    if (comment.user?.first_name) {
      const first = comment.user.first_name.charAt(0).toUpperCase()
      const last = comment.user.last_name ? comment.user.last_name.charAt(0).toUpperCase() : ''
      return first + last
    }

    if (comment.user?.user_name) {
      return comment.user.user_name.charAt(0).toUpperCase()
    }

    // Fallback to auth store if available
    if (authStore.user?.first_name) {
      const first = authStore.user.first_name.charAt(0).toUpperCase()
      const last = authStore.user.last_name ? authStore.user.last_name.charAt(0).toUpperCase() : ''
      return first + last
    }

    return 'U'
  } catch (e) {
    console.error('Error getting user initial:', e)
    return 'U'
  }
}

// Check if course is enrolled
const isCourseEnrolled = (course) => {
  const status = enrollmentStatuses.value[course.id] || course.enrollment_status
  return status === 'enrolled' || status === 'approved' || status === 'completed'
}

// FIXED: setHeroHeight function
const setHeroHeight = () => {
  if (!heroSection.value) return

  const headerHeight = document.querySelector('.header-wrapper')?.offsetHeight || 0
  const windowHeight = window.innerHeight

  heroSection.value.style.height = `${windowHeight - headerHeight}px`
  document.body.style.overflowX = 'hidden'

  const nextElement = heroSection.value.nextElementSibling
  if (nextElement) {
    nextElement.style.marginTop = '0'
  }
}

const animatePlaceholder = () => {
  if (placeholderIndex.value <= searchPlaceholder.length) {
    currentPlaceholder.value = searchPlaceholder.substring(0, placeholderIndex.value)
    placeholderIndex.value++
  } else {
    setTimeout(() => {
      placeholderIndex.value = 0
      currentPlaceholder.value = ''
      animatePlaceholder()
    }, 3000)
    return
  }

  placeholderInterval = setTimeout(animatePlaceholder, 100)
}

// Search Methods
const handleSearchFocus = () => {
  isSearchFocused.value = true
  showSuggestions.value = true
  if (searchStore && typeof searchStore.loadRecentSearches === 'function') {
    searchStore.loadRecentSearches()
  }
}

const handleSearchBlur = () => {
  isSearchFocused.value = false
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const performSearch = async () => {
  if (!searchInput.value.trim()) return

  try {
    if (searchStore && typeof searchStore.addToRecentSearches === 'function') {
      searchStore.addToRecentSearches(searchInput.value)
    }

    router.push({
      name: 'search-results',
      query: { q: searchInput.value },
    })
  } catch (error) {
    console.error('Search navigation error:', error)
    toast.error('Failed to perform search')
  }
}

const handleQuickSearch = (query) => {
  searchInput.value = query
  performSearch()
}

const removeRecentSearch = (search) => {
  event?.preventDefault()
  event?.stopPropagation()

  if (searchStore && typeof searchStore.removeRecentSearch === 'function') {
    searchStore.removeRecentSearch(search)
  } else {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const updatedSearches = recentSearches.filter((s) => s !== search)
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches))

    if (searchStore) {
      searchStore.recentSearches = updatedSearches
    }
  }

  showSuggestions.value = true
}

const closeAllMenus = () => {
  console.log('🔒 Closing all menus')
  comments.value.forEach((comment) => {
    comment.showMenu = false
    if (comment.replies) {
      comment.replies.forEach((reply) => {
        reply.showMenu = false
      })
    }
  })
}

const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function (event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}

const toggleReplyLike = async (replyId, commentId) => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to like replies')
    return
  }

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) return

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply) return

  try {
    const response = await axios.post(
      `/api/student/replies/${replyId}/react/`,
      { reaction_type: 'like' },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // Update the reply with new data
    const updatedReply = response.data
    Object.assign(reply, updatedReply)

    toast.success('Reply liked!')
  } catch (error) {
    console.error('Failed to toggle reply like:', error)
    toast.error('Failed to update reaction. Please try again.')
  }
}

const toggleReplyDislike = async (replyId, commentId) => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to dislike replies')
    return
  }

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) return

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply) return

  try {
    const response = await axios.post(
      `/api/student/replies/${replyId}/react/`,
      { reaction_type: 'dislike' },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // Update the reply with new data
    const updatedReply = response.data
    Object.assign(reply, updatedReply)

    toast.success('Reply disliked!')
  } catch (error) {
    console.error('Failed to toggle reply dislike:', error)
    toast.error('Failed to update reaction. Please try again.')
  }
}

const toggleNestedReply = (replyId, commentId) => {
  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) return

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply) return

  // Close all other nested reply forms
  comment.replies.forEach((r) => {
    if (r.id !== replyId) {
      r.showNestedReply = false
    }
  })

  // Toggle this reply's nested reply form
  reply.showNestedReply = !reply.showNestedReply

  // Initialize nested reply text if not exists
  if (!reply.nestedReplyText) {
    reply.nestedReplyText = ''
  }

  // Close menu when opening nested reply
  if (reply.showNestedReply) {
    reply.showMenu = false
  }
}

const submitNestedReply = async (replyId, commentId) => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to post a reply')
    return
  }

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) return

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply || !reply.nestedReplyText.trim()) return

  try {
    // ✅ FIXED: Use the correct endpoint for nested replies
    const response = await axios.post(
      '/api/student/replies/nested/', // This should match your backend URL
      {
        parent_reply: replyId,
        content: reply.nestedReplyText,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // Create the new nested reply
    const nestedReplyData = response.data

    // Initialize nestedReplies array if not exists
    if (!reply.nestedReplies) {
      reply.nestedReplies = []
    }

    // Add the nested reply
    reply.nestedReplies.push({
      ...nestedReplyData,
      user: extractReplyUserName(nestedReplyData),
      user_data: extractReplyUserData(nestedReplyData),
      text: nestedReplyData.content,
      date: nestedReplyData.date || 'Just now',
      showMenu: false,
      editing: false,
      editContent: nestedReplyData.content,
      can_edit: true, // User owns their own reply
      can_delete: true,
    })

    // Clear the form
    reply.nestedReplyText = ''
    reply.showNestedReply = false

    toast.success('Reply posted successfully!')
  } catch (error) {
    console.error('Failed to submit nested reply:', error)

    // Enhanced error handling
    if (error.response?.status === 404) {
      toast.error('Nested reply endpoint not found. Please check backend configuration.')
    } else {
      toast.error('Failed to post nested reply. Please try again.')
    }
  }
}

// FIXED: Enhanced comment loading with better user data handling
// FIXED: Enhanced comment loading with better course data handling
const loadComments = async () => {
  commentsLoading.value = true
  commentsError.value = null

  try {
    console.log('🔍 Loading comments from API...')
    const response = await axios.get('/api/student/comments/')

    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Comments API response:', response.data)

      comments.value = response.data.map((comment) => {
        // Enhanced user data handling with permissions
        const processedComment = {
          ...comment,
          user: extractUserName(comment),
          user_data: extractUserData(comment),
          showReply: false,
          showReplies: false,
          replyText: '',
          // ✅ FIXED: Ensure course is always a title, not an ID
          course:
            comment.course_name ||
            comment.course_title ||
            getCourseTitleFromData(comment) ||
            'Unknown Course',
          date: comment.date || 'Recently',
          liked: comment.liked || false,
          disliked: comment.disliked || false,
          replies: processReplies(comment.replies || []),
          showMenu: false,
          editing: false,
          editContent: comment.content,
          // ✅ ADDED: Permission flags from backend
          can_edit: comment.can_edit || false,
          can_delete: comment.can_delete || false,
        }

        console.log('📝 Processed comment with course:', {
          id: processedComment.id,
          course: processedComment.course,
          can_edit: processedComment.can_edit,
        })

        return processedComment
      })

      console.log('✅ Processed comments with course titles:', comments.value)
    } else {
      console.log('ℹ️ No comments found or empty response')
      comments.value = []
    }
  } catch (error) {
    console.error('❌ Failed to load comments:', error)
    commentsError.value = 'Failed to load comments'
    comments.value = []
  } finally {
    commentsLoading.value = false
  }
}

// ✅ ADD THIS HELPER FUNCTION to extract course title from various data structures
const getCourseTitleFromData = (comment) => {
  try {
    // If course is already a string (title), use it
    if (typeof comment.course === 'string' && comment.course !== '') {
      return comment.course
    }

    // If course_name exists, use it
    if (comment.course_name) {
      return comment.course_name
    }

    // If course is an object with title property
    if (comment.course && typeof comment.course === 'object' && comment.course.title) {
      return comment.course.title
    }

    // If we have course_id, try to find the title in our courses list
    if (comment.course_id) {
      const course = allCourses.value.find((c) => c.id === comment.course_id)
      if (course) return course.title
    }

    return 'Unknown Course'
  } catch (e) {
    console.error('Error getting course title:', e)
    return 'Unknown Course'
  }
}

const extractUserData = (comment) => {
  try {
    // If user is an object with data
    if (comment.user && typeof comment.user === 'object') {
      return comment.user
    }

    // If we have user_name but no user object
    if (comment.user_name) {
      return { user_name: comment.user_name }
    }

    // Return minimal user data
    return { user_name: extractUserName(comment) }
  } catch (e) {
    console.error('Error extracting user data:', e)
    return { user_name: 'Unknown User' }
  }
}

const processReplies = (replies) => {
  if (!replies || !Array.isArray(replies)) {
    return []
  }

  return replies.map((reply) => {
    const processedReply = {
      ...reply,
      user: extractReplyUserName(reply),
      user_data: extractReplyUserData(reply),
      text: reply.text || reply.content,
      showMenu: false,
      editing: false,
      editContent: reply.text || reply.content,
      can_edit: reply.can_edit || false,
      can_delete: reply.can_delete || false,
      liked: reply.liked || false,
      disliked: reply.disliked || false,
      likes: reply.likes || 0,
      dislikes: reply.dislikes || 0,
      showNestedReply: false,
      nestedReplyText: '',
      showNestedReplies: false,
      nestedReplies: processNestedReplies(reply.nested_replies || []),
    }

    console.log('📝 Processed reply:', {
      id: processedReply.id,
      user: processedReply.user,
      can_edit: processedReply.can_edit,
      can_delete: processedReply.can_delete,
      nestedReplies: processedReply.nestedReplies.length,
    })

    return processedReply
  })
}

const processNestedReplies = (nestedReplies) => {
  if (!nestedReplies || !Array.isArray(nestedReplies)) {
    return []
  }

  return nestedReplies.map((nestedReply) => {
    return {
      ...nestedReply,
      user: extractReplyUserName(nestedReply),
      user_data: extractReplyUserData(nestedReply),
      text: nestedReply.text || nestedReply.content,
      showMenu: false,
      editing: false,
      editContent: nestedReply.text || nestedReply.content,
      can_edit: nestedReply.can_edit || false,
      can_delete: nestedReply.can_delete || false,
      // Nested replies don't have like/dislike functionality
      parent_reply: true, // Mark as nested reply
    }
  })
}

const extractReplyUserName = (reply) => {
  try {
    if (typeof reply.user === 'string') {
      return reply.user
    }

    if (reply.user_name) {
      return reply.user_name
    }

    if (reply.user?.first_name && reply.user?.last_name) {
      return `${reply.user.first_name} ${reply.user.last_name}`
    }

    if (reply.user?.user_name) {
      return reply.user.user_name
    }

    if (reply.user_data?.first_name && reply.user_data?.last_name) {
      return `${reply.user_data.first_name} ${reply.user_data.last_name}`
    }

    if (reply.user_data?.user_name) {
      return reply.user_data.user_name
    }

    return 'Unknown User'
  } catch (e) {
    console.error('Error extracting reply user name:', e)
    return 'Unknown User'
  }
}

const extractReplyUserData = (reply) => {
  try {
    if (reply.user && typeof reply.user === 'object') {
      return reply.user
    }

    if (reply.user_data) {
      return reply.user_data
    }

    if (reply.user_name) {
      return { user_name: reply.user_name }
    }

    return { user_name: extractReplyUserName(reply) }
  } catch (e) {
    console.error('Error extracting reply user data:', e)
    return { user_name: 'Unknown User' }
  }
}

// FIXED: Reply helper functions
const getReplyInitial = (reply) => {
  try {
    // Priority 1: user_data from backend
    if (reply.user_data?.first_name) {
      const first = reply.user_data.first_name.charAt(0).toUpperCase()
      const last = reply.user_data.last_name
        ? reply.user_data.last_name.charAt(0).toUpperCase()
        : ''
      return first + last
    }

    // Priority 2: direct user object
    if (reply.user?.first_name) {
      const first = reply.user.first_name.charAt(0).toUpperCase()
      const last = reply.user.last_name ? reply.user.last_name.charAt(0).toUpperCase() : ''
      return first + last
    }

    // Priority 3: user_name field
    if (reply.user_name) {
      return reply.user_name.charAt(0).toUpperCase()
    }

    // Fallback
    return 'U'
  } catch (e) {
    console.error('Error getting reply initial:', e)
    return 'U'
  }
}

const getReplyName = (reply) => {
  try {
    // Priority 1: user_data from backend
    if (reply.user_data?.first_name && reply.user_data?.last_name) {
      return `${reply.user_data.first_name} ${reply.user_data.last_name}`
    }

    if (reply.user_data?.user_name) {
      return reply.user_data.user_name
    }

    // Priority 2: direct user object
    if (reply.user?.first_name && reply.user?.last_name) {
      return `${reply.user.first_name} ${reply.user.last_name}`
    }

    if (reply.user?.user_name) {
      return reply.user.user_name
    }

    // Priority 3: user_name field directly on reply
    if (reply.user_name) {
      return reply.user_name
    }

    // Priority 4: fallback to authenticated user
    if (authStore.user?.first_name && authStore.user?.last_name) {
      return `${authStore.user.first_name} ${authStore.user.last_name}`
    }

    // Final fallback
    return 'User'
  } catch (e) {
    console.error('Error getting reply name:', e)
    return 'User'
  }
}

// NEW: Comment and Reply Edit/Delete Methods
const toggleCommentMenu = (commentId, event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  console.log(`🔧 Toggling comment menu for comment ${commentId}`)

  const comment = comments.value.find((c) => c.id === commentId)
  if (comment) {
    // Close all other menus first
    comments.value.forEach((c) => {
      if (c.id !== commentId) {
        c.showMenu = false
      }
      // Close all reply menus in this comment
      if (c.replies) {
        c.replies.forEach((reply) => {
          reply.showMenu = false
        })
      }
    })

    // Toggle this comment's menu
    comment.showMenu = !comment.showMenu
    console.log(`✅ Comment menu toggled. New state: ${comment.showMenu}`)
  }
}

const toggleReplyMenu = (replyId, commentId, event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }

  console.log(`🔧 Toggling reply menu for reply ${replyId} in comment ${commentId}`)

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) {
    console.error('❌ Comment or replies not found')
    return
  }

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply) {
    console.error('❌ Reply not found')
    return
  }

  // Close all other menus first
  comments.value.forEach((c) => {
    c.showMenu = false // Close all comment menus
    if (c.replies) {
      c.replies.forEach((r) => {
        if (r.id !== replyId) {
          r.showMenu = false
        }
      })
    }
  })

  // Toggle this reply's menu
  reply.showMenu = !reply.showMenu
  console.log(`✅ Reply menu toggled. New state: ${reply.showMenu}`)
}

const startEditComment = (comment) => {
  comment.editing = true
  comment.editContent = comment.content
  comment.showMenu = false
}

const cancelEditComment = (comment) => {
  comment.editing = false
  comment.editContent = comment.content
}

const saveEditComment = async (comment) => {
  if (!comment.editContent.trim()) {
    toast.error('Comment cannot be empty')
    return
  }

  try {
    // ✅ FIXED: Only send content for updates, not course
    const response = await axios.patch(
      `/api/student/comments/${comment.id}/update/`,
      { content: comment.editContent }, // Only send content, not course
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // ✅ FIXED: Update the comment locally WITHOUT replacing the course
    // Preserve the course title and only update the content
    comment.content = comment.editContent
    comment.editing = false
    comment.edited = true // Mark as edited

    // Update other fields from response if needed, but preserve course display
    if (response.data.likes !== undefined) comment.likes = response.data.likes
    if (response.data.dislikes !== undefined) comment.dislikes = response.data.dislikes
    if (response.data.edited_at) comment.edited_at = response.data.edited_at

    toast.success('Comment updated successfully!')
  } catch (error) {
    console.error('Failed to update comment:', error)
    if (error.response?.status === 403) {
      toast.error('You do not have permission to edit this comment.')
    } else if (error.response?.status === 404) {
      toast.error('Comment not found.')
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    } else {
      toast.error('Failed to update comment')
    }
  }
}

const confirmDeleteComment = async (commentId) => {
  if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
    return
  }

  try {
    await axios.delete(`/api/student/comments/${commentId}/delete/`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    // Remove comment from local state
    const index = comments.value.findIndex((c) => c.id === commentId)
    if (index !== -1) {
      comments.value.splice(index, 1)
    }

    toast.success('Comment deleted successfully!')
  } catch (error) {
    console.error('Failed to delete comment:', error)
    if (error.response?.status === 403) {
      toast.error('You do not have permission to delete this comment.')
    } else if (error.response?.status === 404) {
      toast.error('Comment not found.')
    } else {
      toast.error('Failed to delete comment')
    }
  }
}

const startEditReply = (reply, commentId) => {
  console.log(`📝 Starting edit for reply ${reply.id}`)

  reply.editing = true
  reply.editContent = reply.text || reply.content
  reply.showMenu = false

  console.log(`✅ Edit mode activated for reply ${reply.id}`)
}

// ✅ Cancel editing
const cancelEditReply = (reply) => {
  console.log(`❌ Canceling edit for reply ${reply.id}`)

  reply.editing = false
  reply.editContent = reply.text || reply.content
}

// ✅ Save edited reply
const saveEditReply = async (reply, commentId) => {
  if (!reply.editContent.trim()) {
    toast.error('Reply cannot be empty')
    return
  }

  try {
    console.log(`💾 Saving reply ${reply.id}...`)

    const response = await axios.patch(
      `/api/student/replies/${reply.id}/update/`,
      { content: reply.editContent },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // ✅ FIXED: Update the reply locally WITHOUT replacing user data
    reply.text = reply.editContent
    reply.content = reply.editContent
    reply.editing = false
    reply.edited = true // Mark as edited

    // Update other fields from response if needed
    if (response.data.likes !== undefined) reply.likes = response.data.likes
    if (response.data.dislikes !== undefined) reply.dislikes = response.data.dislikes
    if (response.data.edited_at) reply.edited_at = response.data.edited_at

    toast.success('Reply updated successfully!')
    console.log(`✅ Reply ${reply.id} saved successfully`)
  } catch (error) {
    console.error('❌ Failed to update reply:', error)

    if (error.response?.status === 403) {
      toast.error('You do not have permission to edit this reply.')
    } else if (error.response?.status === 404) {
      toast.error('Reply not found.')
    } else {
      toast.error('Failed to update reply')
    }
  }
}

const confirmDeleteReply = async (replyId, commentId) => {
  if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
    return
  }

  try {
    console.log(`🗑️ Deleting reply ${replyId}...`)

    await axios.delete(`/api/student/replies/${replyId}/delete/`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    // Remove reply from local state
    const comment = comments.value.find((c) => c.id === commentId)
    if (comment && comment.replies) {
      const replyIndex = comment.replies.findIndex((r) => r.id === replyId)
      if (replyIndex !== -1) {
        comment.replies.splice(replyIndex, 1)
      }
    }

    toast.success('Reply deleted successfully!')
    console.log(`✅ Reply ${replyId} deleted successfully`)
  } catch (error) {
    console.error('❌ Failed to delete reply:', error)

    if (error.response?.status === 403) {
      toast.error('You do not have permission to delete this reply.')
    } else if (error.response?.status === 404) {
      toast.error('Reply not found.')
    } else {
      toast.error('Failed to delete reply')
    }
  }
}

// FIXED: Submit comment - ensure it appears immediately
const submitComment = async () => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to post a comment')
    return
  }

  if (!newComment.value.content.trim()) {
    toast.error('Please enter your feedback')
    return
  }

  if (newComment.value.content.length > 500) {
    toast.error('Your feedback must be 500 characters or less.')
    return
  }

  if (!newComment.value.course) {
    toast.error('Please select a course')
    return
  }

  try {
    console.log('🎯 Starting comment submission...')

    // ✅ FIXED: Use the course ID directly (it's already stored as ID from dropdown)
    const courseId = newComment.value.course

    // Validate that the course exists in our loaded courses
    const selectedCourse = allCourses.value.find((course) => course.id == courseId)
    if (!selectedCourse) {
      toast.error('Please select a valid course')
      return
    }

    console.log('📝 Submitting comment with:', {
      course_id: courseId,
      content: newComment.value.content,
      selected_course: selectedCourse.title,
    })

    const response = await axios.post(
      '/api/student/comments/create/',
      {
        course: courseId, // Send course ID (integer)
        content: newComment.value.content,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ Comment creation response:', response.data)

    // Add the new comment to the list with proper user data and permissions
    const newCommentData = {
      ...response.data,
      user: extractUserName(response.data),
      user_data: extractUserData(response.data),
      showReply: false,
      showReplies: false,
      replyText: '',
      course: selectedCourse.title, // Use the course title for display
      course_name: selectedCourse.title, // Also set course_name for consistency
      date: 'Just now',
      liked: false,
      disliked: false,
      replies: [],
      showMenu: false,
      editing: false,
      editContent: response.data.content,
      can_edit: true,
      can_delete: true,
    }

    // Add to beginning of array so it appears immediately
    comments.value.unshift(newCommentData)

    // Reset form
    newComment.value = {
      user: '',
      course: '', // Reset to empty string
      content: '',
      rating: 5,
    }

    toast.success('Thank you for sharing your feedback! Your comment has been posted.')
  } catch (error) {
    console.error('❌ Failed to submit comment:', error)
    console.error('Error response:', error.response?.data)

    // Enhanced error handling
    if (error.response?.status === 400) {
      if (error.response.data?.error) {
        toast.error(error.response.data.error)
      } else if (error.response.data?.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Invalid data submitted. Please check your input.')
      }
    } else if (error.response?.status === 403) {
      toast.error('You must be enrolled in this course to comment.')
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    } else {
      toast.error('Failed to post comment. Please try again.')
    }
  }
}

const submitReply = async (commentId) => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to post a reply')
    return
  }

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replyText.trim()) return

  try {
    const response = await axios.post(
      '/api/student/comments/reply/',
      {
        comment: commentId,
        content: comment.replyText,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      },
    )

    // Handle different response structures
    const replyData = response.data

    // Create the new reply with proper user data and permissions
    const newReply = {
      id: replyData.id || (comment.replies ? comment.replies.length + 1 : 1),
      user: extractReplyUserName(replyData),
      user_data: extractReplyUserData(replyData),
      text: replyData.content || replyData.text,
      date: replyData.date || 'Just now',
      showMenu: false,
      editing: false,
      editContent: replyData.content || replyData.text,
      // ✅ ADDED: Current user automatically has edit/delete permissions for their own replies
      can_edit: true,
      can_delete: true,
    }

    if (!comment.replies) comment.replies = []
    comment.replies.push(newReply)
    comment.replyText = ''
    comment.showReply = false

    if (!comment.showReplies) {
      comment.showReplies = true
    }

    toast.success('Reply posted successfully!')
  } catch (error) {
    console.error('Failed to submit reply:', error)

    // Enhanced error handling
    if (error.response?.status === 500) {
      // Fallback: Create reply locally if server fails
      const newReply = {
        id: comment.replies ? comment.replies.length + 1 : 1,
        user: authStore.user?.first_name + ' ' + authStore.user?.last_name || 'You',
        user_data: {
          first_name: authStore.user?.first_name,
          last_name: authStore.user?.last_name,
          user_name: authStore.user?.first_name + ' ' + authStore.user?.last_name,
        },
        text: comment.replyText,
        date: 'Just now',
        showMenu: false,
        editing: false,
        editContent: comment.replyText,
        // ✅ ADDED: Permissions for locally created reply
        can_edit: true,
        can_delete: true,
      }

      if (!comment.replies) comment.replies = []
      comment.replies.push(newReply)
      comment.replyText = ''
      comment.showReply = false

      if (!comment.showReplies) {
        comment.showReplies = true
      }

      toast.success('Reply posted successfully! (Note: May not be saved due to server issue)')
    } else {
      toast.error('Failed to post reply. Please try again.')
    }
  }
}

const toggleLike = async (commentId) => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to like comments')
    return
  }

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment) return

  try {
    const response = await axios.post(
      `/api/student/comments/${commentId}/react/`,
      { reaction_type: 'like' },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      },
    )

    // Update the comment with new data
    const updatedComment = response.data
    comment.likes = updatedComment.likes
    comment.dislikes = updatedComment.dislikes
    comment.liked = updatedComment.liked
    comment.disliked = updatedComment.disliked
  } catch (error) {
    console.error('Failed to toggle like:', error)
    toast.error('Failed to update reaction. Please try again.')
  }
}

const toggleDislike = async (commentId) => {
  if (!authStore.isAuthenticated) {
    toast.error('Please login to dislike comments')
    return
  }

  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment) return

  try {
    const response = await axios.post(
      `/api/student/comments/${commentId}/react/`,
      { reaction_type: 'dislike' },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
      },
    )

    // Update the comment with new data
    const updatedComment = response.data
    comment.likes = updatedComment.likes
    comment.dislikes = updatedComment.dislikes
    comment.liked = updatedComment.liked
    comment.disliked = updatedComment.disliked
  } catch (error) {
    console.error('Failed to toggle dislike:', error)
    toast.error('Failed to update reaction. Please try again.')
  }
}

// UI methods for comments
const toggleReply = (commentId) => {
  const comment = comments.value.find((c) => c.id === commentId)
  if (comment) {
    comment.showReply = !comment.showReply
    // Close menu when opening reply
    if (comment.showReply) {
      comment.showMenu = false
    }
  }
}

const toggleReplies = (commentId) => {
  const comment = comments.value.find((c) => c.id === commentId)
  if (comment) {
    comment.showReplies = !comment.showReplies
  }
}

const loadMoreComments = () => {
  commentsToShow.value += 3
}

const getRandomColor = () => {
  const colors = ['#087990', '#28a745', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Toggle nested replies visibility
const toggleNestedReplies = (replyId, commentId) => {
  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) return

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply) return

  // Toggle nested replies visibility
  reply.showNestedReplies = !reply.showNestedReplies
}

// Toggle nested reply menu
const toggleNestedReplyMenu = (nestedReplyId, replyId, commentId) => {
  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment || !comment.replies) return

  const reply = comment.replies.find((r) => r.id === replyId)
  if (!reply || !reply.nestedReplies) return

  const nestedReply = reply.nestedReplies.find((nr) => nr.id === nestedReplyId)
  if (!nestedReply) return

  // Close all other menus first
  comments.value.forEach((c) => {
    if (c.replies) {
      c.replies.forEach((r) => {
        r.showMenu = false
        if (r.nestedReplies) {
          r.nestedReplies.forEach((nr) => {
            nr.showMenu = false
          })
        }
      })
    }
  })

  // Toggle this nested reply's menu
  nestedReply.showMenu = !nestedReply.showMenu
}

// Start editing nested reply
const startEditNestedReply = (nestedReply, replyId, commentId) => {
  console.log(`Starting edit for nested reply ${nestedReply.id}`)
  nestedReply.editing = true
  nestedReply.editContent = nestedReply.text || nestedReply.content
  nestedReply.showMenu = false
}

// Cancel editing nested reply
const cancelEditNestedReply = (nestedReply) => {
  console.log(`Canceling edit for nested reply ${nestedReply.id}`)
  nestedReply.editing = false
  nestedReply.editContent = nestedReply.text || nestedReply.content
}

// Save edited nested reply
const saveEditNestedReply = async (nestedReply, replyId, commentId) => {
  if (!nestedReply.editContent.trim()) {
    toast.error('Reply cannot be empty')
    return
  }

  try {
    console.log(`Saving nested reply ${nestedReply.id}...`)

    const response = await axios.patch(
      `/api/student/replies/${nestedReply.id}/update/`,
      { content: nestedReply.editContent },
      {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // ✅ FIXED: Update the nested reply locally WITHOUT replacing user data
    nestedReply.text = nestedReply.editContent
    nestedReply.content = nestedReply.editContent
    nestedReply.editing = false
    nestedReply.edited = true

    toast.success('Reply updated successfully!')
    console.log(`Nested reply ${nestedReply.id} saved successfully`)
  } catch (error) {
    console.error('Failed to update nested reply:', error)
    toast.error('Failed to update reply')
  }
}

// Confirm delete nested reply
const confirmDeleteNestedReply = async (nestedReplyId, replyId, commentId) => {
  if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
    return
  }

  try {
    console.log(`Deleting nested reply ${nestedReplyId}...`)

    await axios.delete(`/api/student/replies/${nestedReplyId}/delete/`, {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    // Remove nested reply from local state
    const comment = comments.value.find((c) => c.id === commentId)
    if (comment && comment.replies) {
      const reply = comment.replies.find((r) => r.id === replyId)
      if (reply && reply.nestedReplies) {
        const nestedReplyIndex = reply.nestedReplies.findIndex((nr) => nr.id === nestedReplyId)
        if (nestedReplyIndex !== -1) {
          reply.nestedReplies.splice(nestedReplyIndex, 1)
        }
      }
    }

    toast.success('Reply deleted successfully!')
    console.log(`Nested reply ${nestedReplyId} deleted successfully`)
  } catch (error) {
    console.error('Failed to delete nested reply:', error)
    toast.error('Failed to delete reply')
  }
}

// Course Methods (KEEP EXISTING - UNCHANGED)
const loadPopularCourses = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('📚 Loading popular courses for home...')

    let response
    try {
      response = await axios.get('/api/student/home/courses/')
      console.log('✅ Home courses API response:', response.data)

      let courses = []
      if (response.data && Array.isArray(response.data.courses)) {
        courses = response.data.courses
      } else if (response.data && Array.isArray(response.data)) {
        courses = response.data
      } else if (response.data?.courses && typeof response.data.courses === 'object') {
        courses = Object.values(response.data.courses)
      }

      courses = courses.map((course) => ({
        ...course,
        level: course.level || 'Beginner',
        is_new: course.is_new || false,
        teacher_name: course.teacher_name || 'Instructor',
        duration: course.duration || 4,
        lessons_count: course.lessons_count || 0,
        price: course.price || 0,
        enrollment_status: 'not_enrolled',
      }))

      popularCourses.value = courses
        .sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0))
        .slice(0, 3)
    } catch (homeError) {
      console.error('❌ Home endpoint failed:', homeError)
      popularCourses.value = [
        {
          id: 1,
          title: 'Financial Literacy',
          description:
            'Master budgeting, saving, debt management, and interest to break cycles of poverty.',
          code: 'FIN101',
          duration: 4,
          is_new: false,
          level: 'beginner',
          price: 0,
          enrollment_status: 'not_enrolled',
        },
        {
          id: 2,
          title: 'Discipline, Habits & Focus',
          description:
            'Create sustainable routines, break procrastination, and maintain laser focus.',
          code: 'DHF102',
          duration: 6,
          is_new: true,
          level: 'beginner',
          price: 0,
          enrollment_status: 'not_enrolled',
        },
        {
          id: 3,
          title: 'Entrepreneurship Fundamentals',
          description:
            'Learn to register a business, find customers, and earn a profit from scratch.',
          code: 'ENT103',
          duration: 8,
          is_new: false,
          level: 'intermediate',
          price: 0,
          enrollment_status: 'not_enrolled',
        },
      ]
    }

    if (isAuthenticated.value) {
      await loadEnrollmentStatuses()
    }
  } catch (err) {
    console.error('Failed to load popular courses:', err)
    error.value = err.message || 'Failed to load popular courses. Please try again later.'
  } finally {
    loading.value = false
  }
}

const loadEnrollmentStatuses = async () => {
  try {
    console.log('📊 Loading enrollment statuses for popular courses...')
    const response = await axios.get('/api/student/courses/', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    if (response.data && response.data.courses) {
      response.data.courses.forEach((enrolledCourse) => {
        const course = popularCourses.value.find(
          (c) => c.id === enrolledCourse.id || c.code === enrolledCourse.code,
        )
        if (course) {
          enrollmentStatuses.value[course.id] = enrolledCourse.enrollment_status || 'enrolled'
          console.log(
            `✅ Found enrolled popular course: ${course.title} (${enrolledCourse.enrollment_status})`,
          )
        }
      })
    }
  } catch (error) {
    console.error('Failed to load enrollment statuses:', error)
  }
}

const handleEnrollNow = async (course) => {
  console.log('🎯 Enroll Now clicked for popular course:', course.title)

  if (isCourseEnrolled(course)) {
    console.log('ℹ️ Course already enrolled - no action needed')
    return
  }

  currentEnrollingCourse.value = course.id
  const result = await enrollCourse(course)
  currentEnrollingCourse.value = null

  if (result.success) {
    if (result.alreadyEnrolled || result.newlyEnrolled) {
      enrollmentStatuses.value[course.id] = 'enrolled'
      console.log(`✅ Updated enrollment status for ${course.title}`)
    }
  } else {
    console.log('❌ Enrollment failed:', result.error)
  }
}

const viewCourse = (course) => {
  if (isAuthenticated.value) {
    if (isCourseEnrolled(course)) {
      console.log('🎯 Navigating to enrolled popular course:', course.title)
      sessionStorage.setItem('activeCourseSlug', course.code)
      router.push(`/student/courses/${course.code}`)
    } else {
      router.push(`/student/courses/${course.code}?preview=true`)
    }
  } else {
    startGuestPreview(course)
  }
}

const startGuestPreview = async (course) => {
  try {
    console.log('🎯 Starting guest preview for:', course.title)

    if (authStore.isAuthenticated) {
      console.log('✅ User is authenticated, using regular course access')
      router.push(`/student/courses/${course.code}`)
      return
    }

    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start preview session')
        return
      }
    }

    router.push(`/guest/courses/${course.code}`)
  } catch (err) {
    console.error('Failed to start guest preview:', err)
    toast.error('Failed to access course preview')
  }
}

// Lifecycle hooks
onMounted(() => {
  isHeroAnimated.value = true

  nextTick(() => {
    setHeroHeight()
  })

  window.addEventListener('resize', setHeroHeight)
  window.addEventListener('load', setHeroHeight)

  animatePlaceholder()
  loadPopularCourses()
  loadComments()
  loadAllCourses()
})

onUnmounted(() => {
  if (placeholderInterval) {
    clearTimeout(placeholderInterval)
  }

  window.removeEventListener('resize', setHeroHeight)
  window.removeEventListener('load', setHeroHeight)
})
</script>

<style scoped>
.more-courses-container {
  text-align: center;
  margin-top: -2rem;
}

.more-courses-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  /* Reuse the get-started-btn styles */
  background-color: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 10px 14.4px !important;
  border-radius: 4.5px;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.45px;
  margin-top: 1.15rem;
}

.more-courses-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.more-courses-btn i {
  font-size: var(--fs-base);
}

/* Responsive adjustments for the More Courses button */
@media (max-width: 768px) {
  .more-courses-container {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }
}

@media (max-width: 480px) {
  .more-courses-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
}
/* Comment Form Styles */
.add-comment-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
}

.comment-form-title {
  color: #1a365d;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.form-subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.comment-form {
  max-width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #087990;
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background-color: #f7fafc;
  color: #a0aec0;
  cursor: not-allowed;
}

.disabled-input {
  background-color: #f7fafc !important;
  color: #4a5568 !important;
}

.course-select {
  background-color: white;
}

.char-count {
  text-align: right;
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}

.form-helper {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.form-helper a {
  color: #087990;
  text-decoration: none;
}

.form-helper a:hover {
  text-decoration: underline;
}

.submit-comment-btn {
  background: linear-gradient(135deg, #087990, #065c70);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.submit-comment-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #065c70, #054a5c);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 92, 112, 0.3);
}

.submit-comment-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading and Error States for Courses */
.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #087990;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-content i {
  font-size: 2rem;
  color: #e53e3e;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #087990;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .add-comment-section {
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  .comment-form-title {
    font-size: 1.25rem;
  }
}

/* Select dropdown styling */
select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23333' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 0.65rem;
  padding-right: 2.5rem;
}

/* Optgroup styling */
optgroup {
  font-weight: 600;
  color: #1a365d;
}

option {
  font-weight: normal;
  padding: 0.5rem;
}
/* Add these new styles for edit/delete functionality */
.edited-badge {
  color: #6c757d;
  font-size: 0.75rem;
  font-style: italic;
  margin-left: 0.25rem;
}

.edited-badge.small {
  font-size: 0.7rem;
}

.comment-actions-menu,
.reply-actions-menu {
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
}

.menu-trigger {
  cursor: pointer;
  padding: 4px 8px;
  border: none;
  background: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;
  z-index: 10;
}

.menu-trigger:hover {
  background-color: #f5f5f5;
}

.menu-trigger.smallest {
  padding: 1px 4px;
  font-size: 10px;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
}

.nested-replies-container {
  margin-left: 20px;
  border-left: 2px solid #e9ecef;
  padding-left: 15px;
  margin-top: 10px;
}

.nested-replies-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 0;
  color: #6c757d;
  font-size: 0.9em;
  transition: color 0.2s;
}

.nested-replies-header:hover {
  color: #495057;
}

.nested-replies-toggle {
  margin-right: 8px;
  width: 16px;
  text-align: center;
}

.nested-replies-count {
  font-weight: 500;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 0.875rem;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item i {
  width: 16px;
  text-align: center;
}

.edit-btn {
  color: #087990;
}

.delete-btn {
  color: #dc3545;
}

.comment-edit-form,
.reply-edit-form {
  margin: 0.5rem 0;
}

.reply-edit-form {
  width: 100%;
}

.edit-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
}

.edit-textarea:focus {
  outline: none;
  border-color: #087990;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.1);
}

.edit-reply-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: inherit;
}

.edit-reply-input:focus {
  outline: none;
  border-color: #087990;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.1);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-end;
}

.reply-edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: flex-end;
}

.cancel-edit-btn,
.save-edit-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.cancel-edit-btn {
  background: #6c757d;
  color: white;
}

.cancel-edit-btn:hover {
  background: #5a6268;
}

.save-edit-btn {
  background: #087990;
  color: white;
}

.save-edit-btn:hover:not(:disabled) {
  background: #06677e;
}

.save-edit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.cancel-edit-btn.small,
.save-edit-btn.small {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.reply-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.reply-content {
  flex: 1;
}

/* Close menus when clicking outside */
.comment-item,
.reply-item {
  position: relative;
}

/* Existing styles remain the same below */
.loading-state,
.error-state {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-actions {
  margin-top: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #06677e;
}

:root {
  --primary-color: #087990;
  --primary-color-light: rgba(8, 121, 144, 0.2);
  --secondary-color: #444;
  --background-color: #f5f5f5;
  --gray-bg: #f5f5f5;
  --border-color: #ddd;
  --card-bg-color: #ffffff;
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --fs-xs: 0.675rem;
  --fs-sm: 0.7875rem;
  --fs-base: 0.9rem;
  --fs-md: 1.0125rem;
  --fs-lg: 1.1rem;
  --fs-xl: 1.35rem;
  --fs-2xl: 1.575rem;
  --fs-3xl: 1.8rem;
  --fs-4xl: 2.25rem;
}

.hero-section {
  height: calc(100vh - 106px);
  width: 100%;
  background: var(--gray-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 15px;
  position: relative;
  overflow: hidden;
}

.hero-wrapper {
  width: 100%;
  max-width: 800px;
  z-index: 10;
  position: relative;
  margin-top: -1.8rem;
  text-align: center;
  transform: translateY(27px);
  opacity: 0;
  transition: all 0.54s ease;
}

.hero-wrapper.animate-in {
  transform: translateY(0);
  opacity: 1;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--fs-4xl);
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-subtitle {
  font-family: var(--font-body);
  font-size: var(--fs-md);
  color: var(--secondary-color);
  margin-bottom: 1.8rem;
}

.search-container {
  position: relative;
  max-width: 450px;
  width: 90%;
  margin: 1.8rem auto;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  gap: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 10.8px 18px;
  padding-right: 45px;
  font-size: var(--fs-base);
  border: 1.8px solid var(--primary-color);
  border-radius: 27px;
  outline: none;
  font-family: var(--font-body);
  background-color: rgba(255, 255, 255, 0.9);
  transition: all 0.27s ease;
}

.search-input:focus,
.search-input.focus-active {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1.8px var(--primary-color-light);
  background-color: white;
}

.search-icon {
  position: absolute;
  right: 13.5px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-color);
  font-size: var(--fs-lg);
  cursor: pointer;
}

/* Add search suggestions styles */
.search-suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-section {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.suggestion-section:last-child {
  border-bottom: none;
}

.suggestion-section h4 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.suggestion-item:hover {
  background: var(--gray-bg);
}

.suggestion-item i {
  color: var(--primary-color);
  width: 16px;
}

.get-started-btn {
  background-color: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 7.2px 14.4px;
  border-radius: 4.5px;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.45px;
  margin-top: 1.15rem;
}

.get-started-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

/* Rest of your existing styles remain the same */
/* Popular Courses Section */
.popular-courses {
  background-color: var(--gray-bg);
  padding: 4rem 0;
}

.section-title {
  text-align: center !important;
  font-size: var(--fs-2xl) !important;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--secondary-color);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Courses Grid Layout */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 2rem;
}

.course-col {
  display: flex;
}

.course-card {
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1.5px solid var(--border-color);
  transition: all 0.3s ease;
}

.course-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.course-card-title {
  font-size: var(--fs-lg) !important;
  color: var(--primary-color);
  margin: 0;
  flex: 1;
}

.course-tag {
  border-radius: 12px;
  font-size: var(--fs-xs);
  font-weight: 500;
}

.course-tag.new {
  background: #e3f2fd;
  color: #1976d2;
}

.course-code {
  background: #e9ecef !important;
  color: var(--primary-color) !important;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem !important;
  font-weight: 500;
}

.course-card-content {
  flex-grow: 1;
  color: var(--secondary-color);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.course-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
  flex-wrap: wrap;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--fs-sm);
  color: var(--primary-color);
}

.course-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.view-course-btn,
.enroll-btn {
  flex: 1;
  text-align: center;
  padding: 7.2px 14.4px;
  border-radius: 4.5px;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.45px;
  border: none;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-course-btn {
  background-color: var(--primary-color);
  color: white;
}

.view-course-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.enroll-btn {
  background-color: transparent;
  color: var(--primary-color);
  border: 1.8px solid var(--primary-color);
}

.enroll-btn:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1.8px);
}

.enroll-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.enroll-btn:disabled:hover {
  transform: none;
  background-color: transparent;
  color: var(--primary-color);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 2rem;
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #06677e;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--secondary-color);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Comments Section */
.comments-section {
  padding: 3rem 0;
  background-color: var(--gray-bg);
}

.comments-card {
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 2rem;
  border: 1.5px solid var(--border-color);
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.comment-item {
  padding: 1.5rem 0;
}

.comment-separator {
  height: 1px;
  background-color: var(--border-color);
  margin: 1.5rem 0;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--fs-lg);
}

.user-info {
  flex-grow: 1;
}

.user-name {
  margin: 0;
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--secondary-color);
}

.course-tag {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: var(--fs-xs);
  font-weight: 500;
  display: inline-block;
  margin-top: 0.25rem;
}

.comment-date {
  color: #666;
  font-size: var(--fs-xs);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.comment-content {
  margin-bottom: 1rem;
}

.comment-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--secondary-color);
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nested-reply-form {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.reply-avatar.smaller {
  width: 24px;
  height: 24px;
  font-size: 0.7rem;
}

.reply-avatar.smallest {
  width: 20px;
  height: 20px;
  font-size: 0.6rem;
}

.nested-replies {
  margin-top: 0.75rem;
  padding-left: 1rem;
  border-left: 2px solid #e9ecef;
}

.nested-replies-list {
  margin-top: 8px;
}

.nested-reply-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.nested-reply-item:last-child {
  border-bottom: none;
}

.nested-reply-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.nested-reply-content {
  flex-grow: 1;
}

.nested-reply-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.nested-reply-user {
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
}

.nested-reply-text {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;
}

.nested-reply-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.nested-reply-actions-menu {
  position: relative;
}

.nested-reply-actions {
  display: none !important;
}

.nested-reply-edit-form {
  margin-top: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.nested-reply-edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* ✅ ENHANCED: Reply actions styling */
.reply-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid #f1f3f4;
  gap: 12px;
}

.reply-actions .action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reply-actions .action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: white;
  color: var(--secondary-color);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reply-actions .action-btn:hover {
  transform: translateY(-1px);
}

.reply-actions .like-btn:hover,
.reply-actions .like-btn.liked {
  background-color: rgba(232, 62, 140, 0.1);
  border-color: #e83e8c;
  color: #e83e8c;
}

.reply-actions .like-btn.liked {
  background-color: #e83e8c;
  color: white;
}

.reply-actions .dislike-btn:hover,
.reply-actions .dislike-btn.disliked {
  background-color: rgba(108, 117, 125, 0.1);
  border-color: #6c757d;
  color: #6c757d;
}

.reply-actions .dislike-btn.disliked {
  background-color: #6c757d;
  color: white;
}

.reply-actions .reply-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.reply-actions .action-count {
  font-weight: 600;
  font-size: 0.7rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8em;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-1px);
  background: #e9ecef;
}

.action-btn.liked {
  color: #dc3545;
}

.action-btn.disliked {
  color: #6c757d;
}

.like-btn:hover,
.like-btn.liked {
  background-color: rgba(232, 62, 140, 0.1);
  border-color: #e83e8c;
  color: #e83e8c;
}

.like-btn.liked {
  background-color: #e83e8c;
  color: white;
}

.dislike-btn:hover,
.dislike-btn.disliked {
  background-color: rgba(108, 117, 125, 0.1);
  border-color: #6c757d;
  color: #6c757d;
}

.dislike-btn.disliked {
  background-color: #6c757d;
  color: white;
}

.reply-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-count {
  font-weight: 600;
  font-size: o.8em;
}

/* Reply Form */
.reply-form {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--fs-sm);
  flex-shrink: 0;
}

.reply-avatar.small {
  width: 28px;
  height: 28px;
  font-size: var(--fs-xs);
  flex-shrink: 0;
}

.reply-input-container {
  display: flex;
  flex-grow: 1;
  gap: 0.5rem;
}

.reply-input {
  flex-grow: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: var(--fs-sm);
  outline: none;
}

.reply-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-light);
}

.submit-reply-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.submit-reply-btn:hover {
  background: #06677e;
  transform: scale(1.1);
}

/* Replies Section */
.replies-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.replies-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.replies-header:hover {
  background-color: var(--primary-color-light);
}

.replies-toggle {
  color: var(--primary-color);
}

.replies-count {
  font-size: var(--fs-sm);
  color: var(--primary-color);
  font-weight: 500;
}

.replies-list {
  margin-top: 1rem;
  padding-left: 2rem;
  display: grid;
  gap: 1rem;
}

.reply-item {
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.reply-content {
  flex-grow: 1;
}

.reply-user {
  font-weight: 600;
  margin-bottom: 4px;
  color: #495057;
}

.reply-text {
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  line-height: 1.4;
  margin-bottom: 8px;
}

.reply-date {
  font-size: 0.8em;
  color: #6c757d;
  margin-bottom: 8px;
}

/* Load More Section */
.load-more-section {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.load-more-btn {
  background: transparent;
  color: var(--primary-color);
  border: 1.8px solid var(--primary-color);
  padding: 10.8px 27px;
  border-radius: 4.5px;
  font-size: var(--fs-base);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
}

.load-more-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1.8px);
}

/* Add Comment Section */
.add-comment-section {
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 2rem;
  border: 1.5px solid var(--border-color);
  transition: all 0.3s ease;
}

.comment-form-title {
  font-size: var(--fs-lg);
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  text-align: center;
}

.form-subtitle {
  text-align: center;
  color: var(--secondary-color);
  margin-bottom: 1.5rem;
  font-size: var(--fs-sm);
}

.comment-form {
  max-width: 100%;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1.8px solid var(--border-color);
  border-radius: 4px;
  font-size: var(--fs-base);
  font-family: var(--font-body);
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1.8px var(--primary-color-light);
}

.char-count {
  text-align: right;
  font-size: var(--fs-xs);
  color: #666;
  margin-top: 0.25rem;
}

.submit-comment-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10.8px 27px;
  border-radius: 4.5px;
  font-size: var(--fs-base);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.45px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  min-width: 200px;
  justify-content: center;
}

.submit-comment-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.remove-search-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-search-btn:hover {
  background: #e2e8f0;
  color: #e53e3e;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.suggestion-item:hover {
  background: #f7fafc;
}

/* Add these styles to your HomeView.vue CSS */

.course-title-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.course-icon {
  color: var(--primary-color); /* This will use your primary color */
  font-size: 1.5rem;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.course-title-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.course-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  line-height: 1.3;
}

.course-code {
  font-size: 0.875rem;
  color: var(--secondary-color);
  background: var(--gray-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

/* Add to HomeView.vue CSS */
.suggestion-icon {
  color: var(--primary-color);
  width: 16px;
  text-align: center;
  margin-right: 0.5rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.suggestion-item:hover {
  background: #f7fafc;
}

.remove-search-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-search-btn:hover {
  background: #e2e8f0;
  color: #e53e3e;
}

/* If you want different icons for different course types, you can add: */
.course-col:nth-child(1) .course-icon {
  content: '\f51c'; /* fa-graduation-cap */
}

.course-col:nth-child(2) .course-icon {
  content: '\f5da'; /* fa-brain */
}

.course-col:nth-child(3) .course-icon {
  content: '\f0b1'; /* fa-briefcase */
}

/* Alternative: Use different FA icons directly */
.course-col:nth-child(1) .course-icon::before {
  content: '\f51c'; /* fa-graduation-cap */
}

.course-col:nth-child(2) .course-icon::before {
  content: '\f5da'; /* fa-brain */
}

.course-col:nth-child(3) .course-icon::before {
  content: '\f0b1'; /* fa-briefcase */
}

.remove-search-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-search-btn:hover {
  background: #e2e8f0;
  color: #e53e3e;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.suggestion-item:hover {
  background: #f7fafc;
}

.search-suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-section {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.suggestion-section:last-child {
  border-bottom: none;
}

.suggestion-section h4 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-icon {
  color: var(--primary-color);
  width: 16px;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-title {
    font-size: var(--fs-3xl);
  }

  .hero-subtitle {
    font-size: var(--fs-base);
  }

  .reply-edit-actions {
    flex-direction: column;
  }

  .nested-reply-form {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .reply-actions .action-buttons {
    gap: 0.5rem;
  }

  .reply-actions .action-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .nested-replies {
    padding-left: 0.5rem;
  }

  .search-input {
    padding: 7.2px 9px;
    padding-right: 40px;
  }

  .hero-section {
    padding: 1.5rem !important;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .course-actions {
    flex-direction: row;
  }

  .comment-header {
    flex-wrap: wrap;
  }

  .action-buttons {
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.4rem 0.6rem;
    font-size: var(--fs-xs);
  }

  .replies-list {
    padding-left: 1rem;
  }

  .comments-card {
    padding: 1.5rem;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .menu-dropdown {
    position: fixed;
    top: auto;
    right: 1rem;
    left: 1rem;
    bottom: 2rem;
  }

  /* Reply Actions Menu Styles */
  .reply-actions-menu {
    position: relative;
    margin-left: auto;
    flex-shrink: 0;
  }

  .menu-trigger {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-trigger:hover {
    background: #f8f9fa;
    color: #495057;
  }

  .menu-trigger.small {
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 120px;
    margin-top: 4px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-size: 0.875rem;
    color: #495057;
  }

  .menu-item:hover {
    background: #f8f9fa;
  }

  .menu-item i {
    width: 16px;
    text-align: center;
  }

  .edit-btn {
    color: #087990;
  }

  .edit-btn:hover {
    background: rgba(8, 121, 144, 0.1);
  }

  .delete-btn {
    color: #dc3545;
  }

  .delete-btn:hover {
    background: rgba(220, 53, 69, 0.1);
  }

  /* Reply Edit Form */
  .reply-edit-form {
    margin: 0.5rem 0;
    width: 100%;
  }

  .edit-reply-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
  }

  .edit-reply-input:focus {
    outline: none;
    border-color: #087990;
    box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.1);
  }

  .reply-edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    justify-content: flex-end;
  }

  .cancel-edit-btn,
  .save-edit-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .cancel-edit-btn {
    background: #6c757d;
    color: white;
  }

  .cancel-edit-btn:hover {
    background: #5a6268;
  }

  .save-edit-btn {
    background: #087990;
    color: white;
  }

  .save-edit-btn:hover:not(:disabled) {
    background: #06677e;
  }

  .save-edit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .cancel-edit-btn.small,
  .save-edit-btn.small {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  /* Reply Header Layout */
  .reply-header {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    position: relative;
  }

  .reply-content {
    flex-grow: 1;
    min-width: 0; /* Allows text to wrap */
  }

  .reply-avatar.small {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  /* Edited Badge */
  .edited-badge {
    color: #6c757d;
    font-size: 0.75rem;
    font-style: italic;
    margin-left: 0.25rem;
  }

  .edited-badge.small {
    font-size: 0.7rem;
  }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .menu-dropdown {
    position: fixed;
    top: auto;
    right: 1rem;
    left: 1rem;
    bottom: 2rem;
  }

  .reply-edit-actions {
    flex-direction: column;
  }

  .cancel-edit-btn,
  .save-edit-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .course-meta {
    flex-direction: flex;
    gap: 0.5rem;
  }

  .course-actions {
    flex-direction: column;
  }

  .edit-actions {
    flex-direction: column;
  }

  .cancel-edit-btn,
  .save-edit-btn {
    width: 100%;
  }
}

@media (max-width: 375px) {
  .hero-title {
    font-size: var(--fs-2xl);
    margin-bottom: 0.9rem;
  }

  .hero-subtitle {
    font-size: var(--fs-sm);
    margin-bottom: 1.35rem;
  }

  .search-container {
    margin: 1.35rem auto;
  }

  .hero-section {
    padding: 1.5rem !important;
  }

  .comments-section {
    padding: 2rem 0;
  }

  .add-comment-section {
    padding: 1.5rem;
  }
}
</style>
