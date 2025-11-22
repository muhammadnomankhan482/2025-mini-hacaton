// dashbord.js - UPDATED VERSION WITH MOBILE RESPONSIVENESS AND IMPROVED UI

let allUsers = JSON.parse(localStorage.getItem("facebookUser")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let selectedImage = null;
let currentPosts = [];
let postsPerPage = 10;
let currentPage = 0;
let isLoading = false;
let currentSort = 'latest';
let isSearching = false;

// Post class
class Post {
  constructor(id, text, ownerId, ownerName, imageUrl = null) {
    this.id = id;
    this.text = text;
    this.ownerId = ownerId;
    this.ownerName = ownerName;
    this.imageUrl = imageUrl;
    this.date = new Date();
    this.reactions = {};
    this.comments = [];
  }
}

// Check user authentication
function checkUser() {
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }
  updateNavProfile();
  loadInitialData();
}
checkUser();

// Update navigation profile
function updateNavProfile() {
  const navProfilePic = document.getElementById('navProfilePic');
  const navUserName = document.getElementById('navUserName');
  const createPostProfilePic = document.getElementById('createPostProfilePic');

  if (navProfilePic) {
    navProfilePic.src = currentUser.profilePicture || 'profile.jpg';
  }
  if (navUserName) {
    navUserName.textContent = currentUser.fullName || 'User';
  }
  if (createPostProfilePic) {
    createPostProfilePic.src = currentUser.profilePicture || 'profile.jpg';
  }
}

// Load initial data
function loadInitialData() {
  showPosts();
  setupInfiniteScroll();
  loadTheme();
  updateSortUI();
  setupSearch();
  setupMobileMenu();
}

// MOBILE MENU FUNCTIONALITY
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuBtn && sidebar && sidebarOverlay) {
    mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
    
    // Close sidebar when clicking on a link
    const sidebarLinks = sidebar.querySelectorAll('.sidebar-item');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', closeMobileSidebar);
    });
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (sidebar && sidebarOverlay) {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    
    // Prevent body scrolling when sidebar is open
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (sidebar && sidebarOverlay) {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// SEARCH FUNCTIONALITY - UPDATED
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.trim();
      
      if (searchTerm === '') {
        isSearching = false;
        showPosts();
        document.getElementById('searchResults').classList.add('hidden');
      } else {
        performSearch(searchTerm);
      }
    });

    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
          performSearch(searchTerm);
        }
      }
    });
  }

  document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('searchInput');
    
    if (!e.target.closest('#searchResults') && !e.target.closest('.search-container') && e.target !== searchInput) {
      searchResults.classList.add('hidden');
    }
  });
}

function performSearch(searchTerm) {
  const searchResults = document.getElementById('searchResults');
  const searchResultsContent = document.getElementById('searchResultsContent');

  if (!searchTerm) {
    searchResults.classList.add('hidden');
    isSearching = false;
    showPosts();
    return;
  }

  isSearching = true;

  const postResults = [];
  allUsers.forEach(user => {
    if (user.posts && Array.isArray(user.posts)) {
      user.posts.forEach(post => {
        if (post.text && post.text.toLowerCase().includes(searchTerm.toLowerCase())) {
          postResults.push({
            ...post,
            user: user
          });
        }
      });
    }
  });

  if (postResults.length === 0) {
    searchResultsContent.innerHTML = `
      <div class="text-center" style="padding: 40px 20px; color: var(--text-secondary);">
        <i class="fa-solid fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
        <h4 style="margin-bottom: 8px;">No posts found</h4>
        <p>Try searching with different keywords</p>
      </div>
    `;
  } else {
    searchResultsContent.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h4 style="font-weight: 600; color: var(--text-secondary);">Found ${postResults.length} posts</h4>
      </div>
      ${postResults.map(post => `
        <div class="search-result-item"
             onclick="focusOnPost(${post.id})">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <img src="${post.user.profilePicture || 'profile.jpg'}" 
                 alt="${post.user.fullName}" 
                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div>
              <p style="font-weight: 600; font-size: 13px;">${post.user.fullName}</p>
              <p style="font-size: 11px; color: var(--text-secondary);">${formatTime(post.date)}</p>
            </div>
          </div>
          <p style="font-size: 13px; color: var(--text-color); margin-bottom: 8px;">${highlightSearchTerm(post.text, searchTerm)}</p>
          <div style="display: flex; align-items: center; gap: 16px; font-size: 11px; color: var(--text-secondary);">
            ${getReactionsCount(post.reactions) > 0 ? `
              <span style="display: flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-heart" style="color: var(--primary-color);"></i>
                <span>${getReactionsCount(post.reactions)}</span>
              </span>
            ` : ''}
            ${post.comments && post.comments.length > 0 ? `
              <span style="display: flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-comment" style="color: var(--primary-color);"></i>
                <span>${post.comments.length}</span>
              </span>
            ` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }

  searchResults.classList.remove('hidden');
  showToast(`Found ${postResults.length} posts for "${searchTerm}"`, "success");
}

function highlightSearchTerm(text, term) {
  if (!term) return text;
  
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 1px 4px; border-radius: 2px;">$1</mark>');
}

function focusOnPost(postId) {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').classList.add('hidden');
  isSearching = false;
  
  showPosts();
  
  const postElement = document.querySelector(`[data-post-id="${postId}"]`);
  if (postElement) {
    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    postElement.style.boxShadow = '0 0 0 2px var(--primary-color)';
    postElement.style.borderRadius = '10px';
    
    setTimeout(() => {
      postElement.style.boxShadow = '';
      postElement.style.borderRadius = '';
    }, 3000);
  }
  
  showToast("Navigated to post", "info");
}

// SHOW POSTS - UPDATED
function showPosts() {
  const postSection = document.getElementById("post-section");
  if (!postSection) return;

  let allPosts = [];
  
  if (isSearching && currentPosts.length > 0) {
    allPosts = [...currentPosts];
  } else {
    allUsers.forEach(user => {
      if (user.posts && Array.isArray(user.posts)) {
        user.posts.forEach(post => {
          allPosts.push({
            ...post,
            user: user
          });
        });
      }
    });
  }

  allPosts = sortPosts(allPosts, currentSort);
  currentPosts = allPosts;
  currentPage = 0;
  
  displayPostsPage();
}

function sortPosts(posts, sortType) {
  switch(sortType) {
    case 'latest':
      return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    case 'oldest':
      return posts.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'most_liked':
      return posts.sort((a, b) => getReactionsCount(b.reactions) - getReactionsCount(a.reactions));
    default:
      return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

function changeSort(sortType) {
  currentSort = sortType;
  updateSortUI();
  showPosts();
  showToast(`Sorted by ${getSortName(sortType)}`, "info");
}

function updateSortUI() {
  document.querySelectorAll('.sort-check').forEach(check => {
    check.classList.add('hidden');
  });
  
  const currentCheck = document.getElementById(`check-${currentSort}`);
  if (currentCheck) {
    currentCheck.classList.remove('hidden');
  }
}

function getSortName(sortType) {
  const names = {
    'latest': 'Latest First',
    'oldest': 'Oldest First', 
    'most_liked': 'Most Liked'
  };
  return names[sortType] || 'Latest';
}

// DISPLAY POSTS WITH REACTIONS - COMPLETELY UPDATED
function displayPostsPage() {
  const postSection = document.getElementById("post-section");
  const startIndex = currentPage * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const postsToShow = currentPosts.slice(startIndex, endIndex);

  if (currentPage === 0) {
    postSection.innerHTML = '';
  }

  if (currentPosts.length === 0) {
    postSection.innerHTML = `
      <div class="no-posts">
        <div class="no-posts-icon">
          <i class="fa-solid fa-newspaper"></i>
        </div>
        <h3>No posts yet</h3>
        <p>Be the first to create a post!</p>
        <button onclick="document.getElementById('post-content').focus()" class="no-posts-btn">
          Create First Post
        </button>
      </div>
    `;
    return;
  }

  postsToShow.forEach(postData => {
    const post = postData;
    const postUser = postData.user || allUsers.find(u => u.id === post.ownerId) || currentUser;
    const userReaction = getUserReaction(post.reactions, currentUser.id);
    const reactionsCount = getReactionsCount(post.reactions);
    const topReactions = getTopReactions(post.reactions);

    const postCard = document.createElement("div");
    postCard.className = "single-post";
    postCard.setAttribute('data-post-id', post.id);
    
    // Build post HTML with proper CSS classes
    postCard.innerHTML = `
      <div class="post-header">
        <img src="${postUser.profilePicture || 'profile.jpg'}" 
             alt="User">
        <div class="post-user-info">
          <div class="post-username">${post.ownerName}</div>
          <div class="post-time">${formatTime(post.date)}</div>
        </div>
        ${post.ownerId === currentUser.id ? `
          <div class="post-actions-header">
            <button onclick="editPost(${post.id})" class="post-edit-btn" title="Edit Post">
              <i class="fa-solid fa-edit"></i>
            </button>
            <button onclick="deletePost(${post.id})" class="post-delete-btn" title="Delete Post">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        ` : ''}
      </div>
      
      ${post.text ? `
        <div class="post-content-text">${post.text}</div>
      ` : ''}
      
      ${post.imageUrl ? `
        <div class="post-image-container">
          <img src="${post.imageUrl}" alt="Post image" class="post-image">
        </div>
      ` : ''}

      <!-- Reactions Bar -->
      ${reactionsCount > 0 ? `
        <div class="reactions-bar">
          <div class="reactions-count">
            <div class="reactions-emojis">
              ${topReactions.map(reaction => `
                <span>${getReactionEmoji(reaction.type)}</span>
              `).join('')}
            </div>
            <span>${reactionsCount}</span>
          </div>
        </div>
      ` : ''}

      <div class="post-actions-bar">
        <div class="reaction-container">
          <button class="reaction-btn ${userReaction ? 'liked' : ''}" data-post-id="${post.id}">
            <span class="reaction-emoji">${userReaction ? getReactionEmoji(userReaction) : '❤️'}</span>
            <span class="reaction-text">${userReaction ? getReactionName(userReaction) : 'Like'}</span>
          </button>
          
          <!-- Reactions Picker -->
          <div class="reactions-picker">
            <div class="reaction-options">
              <button class="reaction-option" data-reaction="like" title="Like">
                <span>❤️</span>
              </button>
              <button class="reaction-option" data-reaction="love" title="Love">
                <span>😍</span>
              </button>
              <button class="reaction-option" data-reaction="haha" title="Haha">
                <span>😂</span>
              </button>
              <button class="reaction-option" data-reaction="wow" title="Wow">
                <span>😮</span>
              </button>
              <button class="reaction-option" data-reaction="sad" title="Sad">
                <span>😢</span>
              </button>
              <button class="reaction-option" data-reaction="angry" title="Angry">
                <span>😠</span>
              </button>
            </div>
          </div>
        </div>
        
        <button class="comment-toggle-btn">
          <i class="fa-regular fa-comment"></i> 
          <span>Comment</span>
        </button>
        
        <button class="save-btn ${isPostSaved(post.id) ? 'saved' : ''}" data-post-id="${post.id}">
          <i class="${isPostSaved(post.id) ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> 
          <span>${isPostSaved(post.id) ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      <div class="comment-section">
        <div class="comment-box">
          <input type="text" class="comment-input" placeholder="Write a comment...">
          <button class="comment-post-btn">Post</button>
        </div>
        <div class="comment-list">
          ${post.comments && post.comments.length > 0 ? post.comments.map((comment, index) => `
            <div class="comment-item">
              <div class="comment-content">
                <div class="comment-author">${comment.userName}:</div>
                <div class="comment-text">${comment.text}</div>
              </div>
              ${comment.userId === currentUser.id ? `
                <button onclick="deleteComment(${post.id}, ${index})" class="delete-comment">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ''}
            </div>
          `).join('') : '<div class="no-comments">No comments yet</div>'}
        </div>
      </div>
    `;

    // Event listeners for reactions - FIXED VERSION
    const reactionBtn = postCard.querySelector('.reaction-btn');
    const reactionsPicker = postCard.querySelector('.reactions-picker');
    const reactionOptions = postCard.querySelectorAll('.reaction-option');

    // Show reactions picker on hover
    reactionBtn.addEventListener('mouseenter', () => {
      reactionsPicker.classList.add('show');
    });

    // Hide reactions picker when mouse leaves
    const reactionContainer = postCard.querySelector('.reaction-container');
    reactionContainer.addEventListener('mouseleave', (e) => {
      // Check if mouse is leaving the entire reaction container
      if (!reactionContainer.contains(e.relatedTarget)) {
        setTimeout(() => {
          reactionsPicker.classList.remove('show');
        }, 300);
      }
    });

    // Handle reaction selection from picker
    reactionOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const reactionType = option.getAttribute('data-reaction');
        addReaction(post.id, reactionType);
        reactionsPicker.classList.remove('show');
      });
    });

    // Handle quick like/unlike on button click
    reactionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentReaction = getUserReaction(post.reactions, currentUser.id);
      
      if (!currentReaction) {
        // If no reaction, add like
        addReaction(post.id, 'like');
      } else if (currentReaction === 'like') {
        // If already liked, remove reaction
        removeReaction(post.id);
      } else {
        // If different reaction, switch to like
        addReaction(post.id, 'like');
      }
    });

    // Comment functionality
    const commentToggle = postCard.querySelector('.comment-toggle-btn');
    const commentSection = postCard.querySelector('.comment-section');
    commentToggle.onclick = () => commentSection.classList.toggle('show');

    const commentPostBtn = postCard.querySelector('.comment-post-btn');
    const commentInput = postCard.querySelector('.comment-input');
    commentPostBtn.onclick = () => {
      const commentText = commentInput.value.trim();
      if (commentText) {
        addComment(post.id, commentText);
        commentInput.value = '';
      }
    };

    commentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const commentText = commentInput.value.trim();
        if (commentText) {
          addComment(post.id, commentText);
          commentInput.value = '';
        }
      }
    });

    // Save post functionality
    const saveBtn = postCard.querySelector('.save-btn');
    saveBtn.onclick = () => toggleSavePost(post.id);

    postSection.appendChild(postCard);
  });

  updateLoadMoreButton();
}

// REACTIONS SYSTEM FUNCTIONS - COMPLETELY FIXED
function addReaction(postId, reactionType) {
  let postUpdated = false;
  let postFound = false;

  // Update in allUsers array
  allUsers.forEach(user => {
    if (user.posts) {
      user.posts.forEach(post => {
        if (post.id === postId) {
          postFound = true;
          if (!post.reactions) post.reactions = {};
          
          // Remove existing reaction from this user
          Object.keys(post.reactions).forEach(type => {
            const index = post.reactions[type].indexOf(currentUser.id);
            if (index !== -1) {
              post.reactions[type].splice(index, 1);
              if (post.reactions[type].length === 0) {
                delete post.reactions[type];
              }
            }
          });
          
          // Add new reaction
          if (!post.reactions[reactionType]) {
            post.reactions[reactionType] = [];
          }
          
          // Only add if not already there
          if (!post.reactions[reactionType].includes(currentUser.id)) {
            post.reactions[reactionType].push(currentUser.id);
            postUpdated = true;
          }
        }
      });
    }
  });

  // Also update in currentUser posts
  if (currentUser.posts) {
    currentUser.posts.forEach(post => {
      if (post.id === postId) {
        if (!post.reactions) post.reactions = {};
        
        // Remove existing reaction from this user
        Object.keys(post.reactions).forEach(type => {
          const index = post.reactions[type].indexOf(currentUser.id);
          if (index !== -1) {
            post.reactions[type].splice(index, 1);
            if (post.reactions[type].length === 0) {
              delete post.reactions[type];
            }
          }
        });
        
        // Add new reaction
        if (!post.reactions[reactionType]) {
          post.reactions[reactionType] = [];
        }
        
        if (!post.reactions[reactionType].includes(currentUser.id)) {
          post.reactions[reactionType].push(currentUser.id);
          postUpdated = true;
        }
      }
    });
  }

  if (postUpdated) {
    saveData();
    updateReactionUI(postId, reactionType);
    showToast(`Reacted with ${getReactionName(reactionType)}!`, "success");
  } else if (!postFound) {
    showToast("Post not found!", "error");
  }
}

function removeReaction(postId) {
  let postUpdated = false;

  // Update in allUsers array
  allUsers.forEach(user => {
    if (user.posts) {
      user.posts.forEach(post => {
        if (post.id === postId && post.reactions) {
          Object.keys(post.reactions).forEach(type => {
            const index = post.reactions[type].indexOf(currentUser.id);
            if (index !== -1) {
              post.reactions[type].splice(index, 1);
              if (post.reactions[type].length === 0) {
                delete post.reactions[type];
              }
              postUpdated = true;
            }
          });
        }
      });
    }
  });

  // Also update in currentUser posts
  if (currentUser.posts) {
    currentUser.posts.forEach(post => {
      if (post.id === postId && post.reactions) {
        Object.keys(post.reactions).forEach(type => {
          const index = post.reactions[type].indexOf(currentUser.id);
          if (index !== -1) {
            post.reactions[type].splice(index, 1);
            if (post.reactions[type].length === 0) {
              delete post.reactions[type];
            }
            postUpdated = true;
          }
        });
      }
    });
  }

  if (postUpdated) {
    saveData();
    updateReactionUI(postId, null);
    showToast("Reaction removed!", "info");
  }
}

function updateReactionUI(postId, reactionType) {
  const postElement = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postElement) return;
  
  const reactionBtn = postElement.querySelector('.reaction-btn');
  const reactionEmoji = reactionBtn.querySelector('.reaction-emoji');
  const reactionText = reactionBtn.querySelector('.reaction-text');
  
  // Update button appearance
  if (reactionType) {
    reactionEmoji.textContent = getReactionEmoji(reactionType);
    reactionText.textContent = getReactionName(reactionType);
    reactionBtn.classList.add('liked');
  } else {
    reactionEmoji.textContent = '❤️';
    reactionText.textContent = 'Like';
    reactionBtn.classList.remove('liked');
  }
  
  // Update reactions count display
  const post = findPostById(postId);
  if (post) {
    const reactionsCount = getReactionsCount(post.reactions);
    const topReactions = getTopReactions(post.reactions);
    
    let reactionsBar = postElement.querySelector('.reactions-bar');
    if (reactionsCount > 0) {
      if (!reactionsBar) {
        reactionsBar = document.createElement('div');
        reactionsBar.className = 'reactions-bar';
        // Insert after content but before actions bar
        const contentElement = postElement.querySelector('.post-content-text') || 
                              postElement.querySelector('.post-image-container');
        if (contentElement) {
          contentElement.after(reactionsBar);
        }
      }
      reactionsBar.innerHTML = `
        <div class="reactions-count">
          <div class="reactions-emojis">
            ${topReactions.map(reaction => `
              <span>${getReactionEmoji(reaction.type)}</span>
            `).join('')}
          </div>
          <span>${reactionsCount}</span>
        </div>
      `;
    } else if (reactionsBar) {
      reactionsBar.remove();
    }
  }
}

// Helper functions for reactions
function getUserReaction(reactions, userId) {
  if (!reactions) return null;
  for (const type in reactions) {
    if (reactions[type].includes(userId)) {
      return type;
    }
  }
  return null;
}

function getReactionsCount(reactions) {
  if (!reactions) return 0;
  let count = 0;
  for (const type in reactions) {
    count += reactions[type].length;
  }
  return count;
}

function getTopReactions(reactions, limit = 3) {
  if (!reactions) return [];
  const reactionTypes = Object.keys(reactions);
  return reactionTypes
    .map(type => ({ type, count: reactions[type].length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getReactionEmoji(type) {
  const emojis = {
    'like': '❤️',
    'love': '😍',
    'haha': '😂',
    'wow': '😮',
    'sad': '😢',
    'angry': '😠'
  };
  return emojis[type] || '❤️';
}

function getReactionName(type) {
  const names = {
    'like': 'Like',
    'love': 'Love',
    'haha': 'Haha',
    'wow': 'Wow',
    'sad': 'Sad',
    'angry': 'Angry'
  };
  return names[type] || 'Like';
}

function findPostById(postId) {
  for (const user of allUsers) {
    if (user.posts) {
      const post = user.posts.find(p => p.id === postId);
      if (post) return post;
    }
  }
  return null;
}

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    const hasMorePosts = (currentPage + 1) * postsPerPage < currentPosts.length;
    loadMoreBtn.classList.toggle('hidden', !hasMorePosts);
  }
}

function loadMorePosts() {
  if (isLoading) return;
  isLoading = true;
  currentPage++;
  
  setTimeout(() => {
    displayPostsPage();
    isLoading = false;
  }, 500);
}

// IMAGE UPLOAD FUNCTIONS
function toggleImageUpload() {
  const uploadSection = document.querySelector('.image-upload-section');
  if (uploadSection.classList.contains('hidden')) {
    uploadSection.classList.remove('hidden');
  } else {
    uploadSection.classList.add('hidden');
  }
}

function removeImage() {
  selectedImage = null;
  document.getElementById('postImage').value = '';
  document.getElementById('imagePreview').innerHTML = '';
}

// EMOJI PICKER - UPDATED
function openEmojiPicker() {
  const postContent = document.getElementById('post-content');
  const rect = postContent.getBoundingClientRect();
  
  const emojiPicker = document.createElement('div');
  emojiPicker.className = 'emoji-picker';
  emojiPicker.style.top = (rect.bottom + 5) + 'px';
  emojiPicker.style.left = rect.left + 'px';
  
  const emojis = ['😀', '😂', '❤️', '😍', '🤔', '👏', '🎉', '🔥', '👍', '🙏', '😊', '🥰', '😎', '🤩', '😜', '🙈', '💯', '✨'];
  
  emojiPicker.innerHTML = `
    <div class="emoji-grid">
      ${emojis.map(emoji => `
        <button class="emoji-btn" onclick="addEmoji('${emoji}')">${emoji}</button>
      `).join('')}
    </div>
  `;
  
  document.body.appendChild(emojiPicker);
  
  setTimeout(() => {
    const closePicker = (e) => {
      if (!emojiPicker.contains(e.target) && e.target !== document.getElementById('post-content')) {
        emojiPicker.remove();
        document.removeEventListener('click', closePicker);
      }
    };
    document.addEventListener('click', closePicker);
  }, 100);
}

function addEmoji(emoji) {
  const postContent = document.getElementById('post-content');
  const start = postContent.selectionStart;
  const end = postContent.selectionEnd;
  const text = postContent.value;
  
  postContent.value = text.substring(0, start) + emoji + text.substring(end);
  postContent.focus();
  postContent.selectionStart = postContent.selectionEnd = start + emoji.length;
  
  document.querySelector('.emoji-picker')?.remove();
}

// IMAGE URL FEATURE - UPDATED
function openImageUrlModal() {
  const modal = document.createElement('div');
  modal.className = 'profile-popup';
  modal.innerHTML = `
    <div class="popup-overlay">
      <div class="popup-card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="popup-title">Add Image URL</h3>
          <span class="popup-close" onclick="this.closest('.profile-popup').remove()">&times;</span>
        </div>
        <input type="url" 
               id="imageUrlInput" 
               placeholder="https://example.com/image.jpg" 
               class="form-input"
               value="${selectedImage || ''}">
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button onclick="addImageFromUrl()" class="btn btn-primary" style="flex: 1;">
            Add Image
          </button>
          <button onclick="this.closest('.profile-popup').remove()" class="btn btn-secondary" style="flex: 1;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  setTimeout(() => {
    document.getElementById('imageUrlInput').focus();
  }, 100);
}

function addImageFromUrl() {
  const imageUrl = document.getElementById('imageUrlInput').value.trim();
  
  if (!imageUrl) {
    showToast("Please enter an image URL", "error");
    return;
  }
  
  if (!isValidUrl(imageUrl)) {
    showToast("Please enter a valid image URL", "error");
    return;
  }
  
  selectedImage = imageUrl;
  
  document.getElementById('imagePreview').innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <img src="${imageUrl}" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px;" onerror="handleImageError()">
      <button class="remove-image">Remove</button>
    </div>
    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Image URL: ${imageUrl}</p>
  `;
  
  document.querySelector('.profile-popup').remove();
  showToast("Image URL added successfully!", "success");
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function handleImageError() {
  showToast("Failed to load image from URL. Please check the URL and try again.", "error");
  removeImage();
}

// POST CREATION
function handlePost() {
  const postContent = document.getElementById("post-content");
  const text = postContent.value.trim();

  if (!text && !selectedImage) {
    showToast("Please write something or add an image before posting!", "error");
    return;
  }

  const post = new Post(
    Date.now() + Math.random(),
    text,
    currentUser.id,
    currentUser.fullName,
    selectedImage
  );

  if (!currentUser.posts) {
    currentUser.posts = [];
  }

  currentUser.posts.unshift(post);

  const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
  if (userIndex !== -1) {
    allUsers[userIndex] = currentUser;
  } else {
    allUsers.push(currentUser);
  }

  saveData();

  postContent.value = "";
  selectedImage = null;
  document.getElementById('imagePreview').innerHTML = '';
  document.querySelector('.image-upload-section').classList.add('hidden');

  showPosts();
  showToast("Post published successfully!", "success");
}

// SAVE POST
function toggleSavePost(postId) {
  if (!currentUser.savedPosts) {
    currentUser.savedPosts = [];
  }

  const saveIndex = currentUser.savedPosts.indexOf(postId);
  if (saveIndex === -1) {
    currentUser.savedPosts.push(postId);
    showToast("Post saved!", "success");
  } else {
    currentUser.savedPosts.splice(saveIndex, 1);
    showToast("Post unsaved!", "info");
  }

  saveData();
  showPosts();
}

function isPostSaved(postId) {
  return currentUser.savedPosts && currentUser.savedPosts.includes(postId);
}

// EDIT POST
function editPost(postId) {
  let postToEdit = null;

  if (currentUser.posts) {
    postToEdit = currentUser.posts.find(p => p.id === postId);
  }

  if (!postToEdit) {
    showToast("Post not found!", "error");
    return;
  }

  const newText = prompt("Edit your post:", postToEdit.text);
  if (newText !== null && newText.trim() !== "") {
    postToEdit.text = newText.trim();
    saveData();
    showPosts();
    showToast("Post updated successfully!", "success");
  }
}

// DELETE POST
function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  if (currentUser.posts) {
    currentUser.posts = currentUser.posts.filter(p => p.id !== postId);
  }

  allUsers = allUsers.map(user => 
    user.id === currentUser.id ? currentUser : user
  );

  saveData();
  showPosts();
  showToast("Post deleted successfully!", "success");
}

// COMMENT SYSTEM
function addComment(postId, text) {
  let commentAdded = false;

  allUsers.forEach(user => {
    if (user.posts) {
      user.posts.forEach(post => {
        if (post.id === postId) {
          if (!post.comments) post.comments = [];
          post.comments.push({
            userId: currentUser.id,
            userName: currentUser.fullName,
            text: text,
            date: new Date()
          });
          commentAdded = true;
        }
      });
    }
  });

  if (commentAdded) {
    saveData();
    showPosts();
    showToast("Comment added!", "success");
  }
}

function deleteComment(postId, commentIndex) {
  allUsers.forEach(user => {
    if (user.posts) {
      user.posts.forEach(post => {
        if (post.id === postId && post.comments && post.comments[commentIndex]) {
          post.comments.splice(commentIndex, 1);
        }
      });
    }
  });

  saveData();
  showPosts();
  showToast("Comment deleted!", "success");
}

// PROFILE POPUP MANAGEMENT
function openProfilePopup() {
  const profilePopup = document.getElementById("userProfilePopup");
  const popupName = document.getElementById("popupName");
  const popupEmail = document.getElementById("popupEmail");
  const popupBio = document.getElementById("popupBio");
  const popupProfilePic = document.getElementById("popupProfilePic");

  popupName.textContent = currentUser.fullName || "User Name";
  popupEmail.textContent = currentUser.email || "user@email.com";
  popupBio.textContent = currentUser.bio || "No bio yet";
  popupProfilePic.src = currentUser.profilePicture || "profile.jpg";
  
  profilePopup.classList.remove("hidden");
}

function openEditProfile() {
  const popup = document.getElementById('editProfilePopup');
  const editFirstName = document.getElementById('editFirstName');
  const editSureName = document.getElementById('editSureName');
  const editEmail = document.getElementById('editEmail');
  const editBio = document.getElementById('editBio');
  const editProfilePic = document.getElementById('editProfilePic');

  const names = (currentUser.fullName || "").split(" ");
  editFirstName.value = names[0] || '';
  editSureName.value = names.slice(1).join(" ") || '';
  editEmail.value = currentUser.email || '';
  editBio.value = currentUser.bio || '';
  editProfilePic.src = currentUser.profilePicture || 'profile.jpg';

  popup.classList.remove('hidden');
  document.getElementById('userProfilePopup').classList.add('hidden');
}

function saveProfile() {
  const editFirstName = document.getElementById('editFirstName');
  const editSureName = document.getElementById('editSureName');
  const editEmail = document.getElementById('editEmail');
  const editBio = document.getElementById('editBio');
  const editProfilePic = document.getElementById('editProfilePic');

  if (editFirstName && editFirstName.value) {
    currentUser.firstName = editFirstName.value;
  }
  if (editSureName && editSureName.value) {
    currentUser.sureName = editSureName.value;
  }
  if (editEmail && editEmail.value) {
    currentUser.email = editEmail.value;
  }
  if (editBio) {
    currentUser.bio = editBio.value;
  }

  currentUser.fullName = (editFirstName.value + " " + editSureName.value).trim();
  currentUser.profilePicture = editProfilePic.src;

  saveData();
  updateNavProfile();

  document.getElementById('editProfilePopup').classList.add('hidden');
  showToast('Profile updated successfully!', 'success');
}

// LOGOUT FUNCTION
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("theme");
    window.location.href = "index.html";
  }
}

// UTILITY FUNCTIONS
function formatTime(date) {
  const now = new Date();
  const postDate = new Date(date);
  const diff = now - postDate;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return postDate.toLocaleDateString();
}

function saveData() {
  localStorage.setItem("facebookUser", JSON.stringify(allUsers));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function showToast(message, type = 'info') {
  document.querySelectorAll('.toast').forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// THEME SYSTEM - IMPROVED
function toggleTheme() {
  const html = document.documentElement;
  const themeIcon = document.getElementById('themeIcon');
  
  if (html.classList.contains('dark')) {
    // Switch to light mode
    html.classList.remove('dark');
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    themeIcon.className = 'fa-solid fa-moon';
    showToast("Light mode activated", "info");
  } else {
    // Switch to dark mode
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    themeIcon.className = 'fa-solid fa-sun';
    showToast("Dark mode activated", "info");
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const themeIcon = document.getElementById('themeIcon');
  const html = document.documentElement;
  
  if (savedTheme === 'dark') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
    if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
  } else {
    html.classList.remove('dark');
    html.removeAttribute('data-theme');
    if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
  }
}

// INFINITE SCROLL
function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if (isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if ((currentPage + 1) * postsPerPage < currentPosts.length) {
        loadMorePosts();
      }
    }
  });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Image upload
  const postImageInput = document.getElementById('postImage');
  if (postImageInput) {
    postImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          selectedImage = e.target.result;
          document.getElementById('imagePreview').innerHTML = `
            <img src="${selectedImage}" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px;">
            <button class="remove-image">Remove</button>
          `;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Profile picture upload
  const profilePictureInput = document.getElementById('profilePictureInput');
  if (profilePictureInput) {
    profilePictureInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('editProfilePic').src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Close popups when clicking outside
  window.onclick = function(e) {
    const profilePopup = document.getElementById('userProfilePopup');
    const editPopup = document.getElementById('editProfilePopup');
    const notificationsPopup = document.getElementById('notificationsPopup');

    if (e.target === profilePopup) profilePopup.classList.add("hidden");
    if (e.target === editPopup) editPopup.classList.add('hidden');
    if (e.target === notificationsPopup) notificationsPopup.classList.add('hidden');
  };

  // Close buttons
  const closeProfile = document.getElementById('closeProfile');
  if (closeProfile) {
    closeProfile.onclick = function() {
      document.getElementById('userProfilePopup').classList.add("hidden");
    };
  }

  const closeEditProfile = document.getElementById('closeEditProfile');
  if (closeEditProfile) {
    closeEditProfile.onclick = function() {
      document.getElementById('editProfilePopup').classList.add('hidden');
    };
  }

  // Load initial data
  loadInitialData();
});

// Notifications functions
function toggleNotifications() {
  const popup = document.getElementById('notificationsPopup');
  popup.classList.toggle('hidden');
}

function loadNotifications() {
  const notificationsList = document.getElementById('notificationsList');
  if (notificationsList) {
    notificationsList.innerHTML = `
      <div class="text-center" style="padding: 40px 20px; color: var(--text-secondary);">
        <i class="fa-solid fa-bell" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
        <h4 style="margin-bottom: 8px;">No notifications</h4>
        <p>Your notifications will appear here</p>
      </div>
    `;
  }
}